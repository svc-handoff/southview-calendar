import ExcelJS from 'exceljs';
import { Readable } from 'node:stream';
import { createHash } from 'node:crypto';
import { personId } from '../people-directory.ts';
import type { MemorialPerson, RecordSource } from '../memorial-records.ts';

export const maxUploadBytes = 4 * 1024 * 1024;
export type DateOrder = 'mdy' | 'dmy';
export type ImportIssue = { row: number; name: string; reason: string };
export class SpreadsheetError extends Error {}
const key = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
function text(value: ExcelJS.CellValue): string {
  if (value == null) return '';
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.toISOString().slice(0, 10) : '';
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
function detectFormat(sheet: ExcelJS.Worksheet, source: RecordSource) {
  for (let row = 1; row <= Math.min(20, sheet.rowCount); row++) {
    const columns = new Map<string, number>();
    let headings = 0;
    sheet.getRow(row).eachCell((cell, index) => {
      const label = key(text(cell.value));
      if (text(cell.value).trim()) headings++;
      if (label) columns.set(label, index);
    });
    if (headings !== columns.size) continue;
    const name = columns.get('name');
    if (source === 'burial') {
      const burial = columns.get('burialdate');
      if (columns.size === 2 && name && burial) return { row, name, burial };
      continue;
    }
    const birth = columns.get('dateofbirth') ?? columns.get('birthdate') ?? columns.get('dob');
    const death = columns.get('dateofdeath') ?? columns.get('deathdate') ?? columns.get('dod');
    if (!birth || !death) continue;
    if (columns.size === 3 && name) return { row, name, birth, death };
    const first = columns.get('firstname');
    const middle = columns.get('middlename');
    const last = columns.get('lastname');
    if (columns.size === 5 && first && middle && last) return { row, first, middle, last, birth, death };
  }
  return null;
}

export async function readPeopleSpreadsheet(buffer: Buffer, fileName: string, options: {
  dateOrder: DateOrder;
  source?: RecordSource;
  sheetName?: string;
}) {
  const { source = 'vital', dateOrder } = options;
  if (!buffer.length || buffer.length > maxUploadBytes) throw new SpreadsheetError('Choose an Excel or CSV file smaller than 4 MB.');
  const workbook = new ExcelJS.Workbook();
  try {
    if (/\.xlsx$/i.test(fileName)) { checkWorkbookSize(buffer); await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]); }
    else if (/\.csv$/i.test(fileName)) await workbook.csv.read(Readable.from([buffer]), { map: value => value });
    else throw new SpreadsheetError('Choose an .xlsx or .csv file.');
  } catch (error) { if (error instanceof SpreadsheetError) throw error; throw new SpreadsheetError('We could not open this spreadsheet. Please save it as .xlsx or .csv and try again.'); }
  const worksheets = workbook.worksheets.filter(sheet => sheet.actualRowCount > 0);
  if (!worksheets.length) throw new SpreadsheetError('This spreadsheet is empty.');
  const matchingSheets = worksheets.flatMap(sheet => {
    const columns = detectFormat(sheet, source);
    return columns ? [{ sheet, columns }] : [];
  });
  const selected = options.sheetName
    ? matchingSheets.find(({ sheet }) => sheet.name === options.sheetName)
    : matchingSheets[0];
  if (!selected) {
    throw new SpreadsheetError(source === 'burial'
      ? 'Use exactly two columns: Name and Burial Date.'
      : 'Use Name, Birthdate, Deathdate or DateOfBirth, DateOfDeath, FirstName, LastName, MiddleName.');
  }

  const { sheet, columns } = selected;
  const people: MemorialPerson[] = [], issues: ImportIssue[] = [];
  const allowed = new Set([columns.name, columns.first, columns.middle, columns.last, columns.birth, columns.death, columns.burial]);
  let rows = 0;
  sheet.eachRow((row, index) => {
    if (index <= columns.row) return;
    if (++rows > 10000) throw new SpreadsheetError('This file has more than 10,000 people. Please split it into smaller files.');
    const name = (columns.name ? text(row.getCell(columns.name).value)
      : [columns.first!, columns.middle!, columns.last!].map(col => text(row.getCell(col).value)).join(' '))
      .replace(/\s+/g, ' ').trim();
    let extraColumn = false;
    row.eachCell((cell, col) => { if (!allowed.has(col) && text(cell.value)) extraColumn = true; });
    if (extraColumn) throw new SpreadsheetError('Remove extra columns from the records before uploading.');
    if (!name || name.length > 180 || !/\p{L}/u.test(name)) {
      issues.push({ row: index, name: name.slice(0, 180), reason: 'Missing or unreadable name' });
      return;
    }
    const person: Omit<MemorialPerson, 'id'> = { name };
    for (const [field, column] of [
      ['birthDate', columns.birth], ['deathDate', columns.death], ['burialDate', columns.burial],
    ] as const) {
      if (!column) continue;
      const value = row.getCell(column).value;
      if (value == null || (typeof value === 'string' && !value.trim())) continue;
      const date = parseBirthDate(value, dateOrder, Boolean(workbook.properties.date1904));
      if (!date) {
        const label = field === 'birthDate' ? 'birth' : field === 'deathDate' ? 'death' : 'burial';
        issues.push({ row: index, name, reason: `Invalid ${label} date. Use a full date, including the year.` });
        return;
      }
      person[field] = date;
    }
    if (!person.birthDate && !person.deathDate && !person.burialDate) {
      issues.push({ row: index, name, reason: source === 'burial' ? 'Missing burial date' : 'Missing birth and death dates' });
      return;
    }
    if (person.birthDate && person.deathDate && person.birthDate > person.deathDate) {
      issues.push({ row: index, name, reason: 'Death date is before birth date' });
      return;
    }
    people.push({ ...person, id: personId(person) });
  });
  if (!rows) throw new SpreadsheetError('There are no people below the column headings.');
  const id = createHash('sha256').update(buffer).update(JSON.stringify({ dateOrder, source, sheetName: sheet.name })).digest('hex');
  return { people, issues, rows, id, sheets: matchingSheets.map(({ sheet }) => sheet.name), sheetName: sheet.name };
}
