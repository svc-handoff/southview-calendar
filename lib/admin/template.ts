import ExcelJS from 'exceljs';
import type { RecordSource } from '../memorial-records.ts';

export const peopleTemplateColumns = ['DateOfBirth', 'DateOfDeath', 'FirstName', 'LastName', 'MiddleName'];
export async function peopleTemplate(source: RecordSource = 'vital') {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(source === 'burial' ? 'Burials' : 'People');
  sheet.addRow(source === 'burial' ? ['Name', 'Burial Date'] : peopleTemplateColumns);
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.columns.forEach(column => { column.width = 24; });
  if (source === 'vital') sheet.getColumn(1).numFmt = 'mm/dd/yyyy';
  sheet.getColumn(2).numFmt = 'mm/dd/yyyy';
  return workbook.xlsx.writeBuffer();
}
