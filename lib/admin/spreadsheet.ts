import ExcelJS from 'exceljs';
import { Readable } from 'node:stream';
import { createHash } from 'node:crypto';
import { personId } from '../people-directory.ts';
import type { BirthdayPerson } from '../google-reminders.ts';

export const maxUploadBytes = 4 * 1024 * 1024;
export type DateOrder = 'mdy' | 'dmy';
export type ImportIssue = { row: number; name: string; reason: string };
export class SpreadsheetError extends Error {}
const key = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
function text(value: ExcelJS.CellValue): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    if ('richText' in value) return value.richText.map(v => v.text).join('');
    if ('text' in value) return value.text;
    return ''; // Never evaluate formulas or follow spreadsheet links.
  }
  return String(value).trim();
}
function isoDate(year: number, month: number, day: number) {
  if (year < 1000 || year > new Date().getUTCFullYear()) return null;
  const value = new Date(Date.UTC(year, month - 1, day));
  if (value.getUTCFullYear() !== year || value.getUTCMonth() !== month - 1 || value.getUTCDate() !== day || value > new Date()) return null;
  return value.toISOString().slice(0, 10);
}
export function parseBirthDate(value: ExcelJS.CellValue, order: DateOrder, date1904 = false) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : isoDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  if (typeof value === 'number' && Number.isFinite(value) && value >= 1 && value < 200000) {
    const date = new Date(Date.UTC(1899, 11, 30) + (Math.floor(value) + (date1904 ? 1462 : 0)) * 86400000);
    return isoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  }
  const raw = text(value);
  let match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:T00:00:00(?:\.000)?Z)?$/.exec(raw);
  if (match) return isoDate(+match[1], +match[2], +match[3]);
  match = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/.exec(raw);
  if (match) return isoDate(+match[3], +(order === 'mdy' ? match[1] : match[2]), +(order === 'mdy' ? match[2] : match[1]));
  const named = /^([a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/i.exec(raw);
  if (named) {
    const month = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(named[1].slice(0,3).toLowerCase()) + 1;
    return month ? isoDate(+named[3], month, +named[2]) : null;
  }
  return null;
}
// Check the ZIP directory before handing the workbook to ExcelJS.
function checkWorkbookSize(buffer: Buffer) {
  const end = buffer.lastIndexOf(Buffer.from([0x50,0x4b,0x05,0x06]));
  if (end < 0 || end + 22 > buffer.length) throw new SpreadsheetError('This is not a readable Excel file. Please save it as .xlsx and try again.');
  const entries = buffer.readUInt16LE(end + 10);
  let offset = buffer.readUInt32LE(end + 16), total = 0;
  if (entries > 1500 || buffer.readUInt16LE(end + 4) !== 0) throw new SpreadsheetError('This workbook is too complex. Please upload a simpler copy containing just the people.');
  for (let n = 0; n < entries; n++) {
    if (offset + 46 > end || buffer.readUInt32LE(offset) !== 0x02014b50) throw new SpreadsheetError('The Excel file is damaged. Please save a fresh copy.');
    if (buffer.readUInt16LE(offset + 8) & 1) throw new SpreadsheetError('Please remove the workbook password before uploading.');
    total += buffer.readUInt32LE(offset + 24);
    if (total > 64 * 1024 * 1024) throw new SpreadsheetError('This workbook contains too much data. Please upload just the people and their dates.');
    offset += 46 + buffer.readUInt16LE(offset + 28) + buffer.readUInt16LE(offset + 30) + buffer.readUInt16LE(offset + 32);
  }
}
const aliases = {
  full: ['name','fullname','person','personname','deceasedname'],
  first: ['firstname','first','givenname'], middle: ['middlename','middle','middleinitial'],
  last: ['lastname','last','surname','familyname'],
  birth: ['dob','birthdate','dateofbirth','birthday','birth'],
};
function columnsFor(sheet: ExcelJS.Worksheet, row: number) {
  const header = sheet.getRow(row);
  const find = (words: string[]) => { for (let col=1; col<=Math.min(header.cellCount,100); col++) if (words.includes(key(text(header.getCell(col).value)))) return col; return 0; };
  return { full:find(aliases.full),first:find(aliases.first),middle:find(aliases.middle),last:find(aliases.last),birth:find(aliases.birth) };
}
export async function readPeopleSpreadsheet(buffer: Buffer, fileName: string, options: { dateOrder: DateOrder; sheetName?: string; nameColumn?: number; birthColumn?: number }) {
  if (!buffer.length || buffer.length > maxUploadBytes) throw new SpreadsheetError('Choose an Excel or CSV file smaller than 4 MB.');
  const workbook = new ExcelJS.Workbook();
  try {
    if (/\.xlsx$/i.test(fileName)) { checkWorkbookSize(buffer); await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]); }
    else if (/\.csv$/i.test(fileName)) await workbook.csv.read(Readable.from([buffer]), { map: value => value });
    else throw new SpreadsheetError('Choose an .xlsx or .csv file.');
  } catch (error) { if (error instanceof SpreadsheetError) throw error; throw new SpreadsheetError('We could not open this spreadsheet. Please save it as .xlsx or .csv and try again.'); }
  const sheets = workbook.worksheets.filter(s => s.actualRowCount > 0).map(s => s.name);
  const sheet = options.sheetName ? workbook.getWorksheet(options.sheetName) : workbook.worksheets.find(s => s.actualRowCount > 0);
  if (!sheet || !sheet.actualRowCount) throw new SpreadsheetError('This spreadsheet is empty.');
  let headerRow = 1, cols = columnsFor(sheet, 1);
  if (!options.nameColumn && !options.birthColumn) for (let n=1; n<=Math.min(20,sheet.rowCount); n++) {
    const found=columnsFor(sheet,n);
    if (found.birth && (found.full || (found.first && found.last))) { headerRow=n; cols=found; break; }
  }
  if (options.nameColumn) cols.full = options.nameColumn;
  if (options.birthColumn) cols.birth = options.birthColumn;
  const headers: string[] = [];
  for (let c=1;c<=Math.min(sheet.getRow(headerRow).cellCount,100);c++) headers.push(text(sheet.getRow(headerRow).getCell(c).value) || `Column ${c}`);
  if (!cols.birth || (!cols.full && !(cols.first && cols.last))) return { needsColumns: true as const, headers, sheets, sheetName: sheet.name };
  const people: BirthdayPerson[] = [], issues: ImportIssue[] = [];
  let rows = 0;
  for (let n=headerRow+1;n<=sheet.rowCount;n++) {
    const row=sheet.getRow(n);
    if (!row.hasValues) continue;
    if (++rows > 10000) throw new SpreadsheetError('This file has more than 10,000 people. Please split it into smaller files.');
    const name = (cols.full ? text(row.getCell(cols.full).value) : [cols.first,cols.middle,cols.last].filter(Boolean).map(c=>text(row.getCell(c).value)).join(' ')).replace(/\s+/g,' ').trim();
    const birthDate = parseBirthDate(row.getCell(cols.birth).value, options.dateOrder, Boolean(workbook.properties.date1904));
    if (!name || name.length > 180 || !/\p{L}/u.test(name)) { issues.push({row:n,name:name.slice(0,180),reason:'Missing or unreadable name'}); continue; }
    if (!birthDate) { issues.push({row:n,name,reason:'Missing or invalid birthday (use a full date, including the year)'}); continue; }
    const person={name,birthDate}; people.push({...person,id:personId(person)});
  }
  if (!rows) throw new SpreadsheetError('There are no people below the column headings.');
  const id = createHash('sha256').update(buffer).update(JSON.stringify({...options,sheetName:sheet.name})).digest('hex');
  return { needsColumns:false as const,people,issues,rows,id,sheets,sheetName:sheet.name,headers };
}
