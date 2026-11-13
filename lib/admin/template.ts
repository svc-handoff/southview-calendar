import ExcelJS from 'exceljs';

export const peopleTemplateColumns = ['DateOfBirth', 'DateOfDeath', 'FirstName', 'LastName', 'MiddleName'];
export async function peopleTemplate() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('People');
  sheet.addRow(peopleTemplateColumns);
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.columns.forEach((column, index) => { column.width = index < 2 ? 18 : 24; });
  sheet.getColumn(1).numFmt = 'mm/dd/yyyy';
  sheet.getColumn(2).numFmt = 'mm/dd/yyyy';
  return workbook.xlsx.writeBuffer();
}
