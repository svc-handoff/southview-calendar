import assert from 'node:assert/strict';
import test from 'node:test';
import ExcelJS from 'exceljs';
import {randomBytes,scryptSync} from 'node:crypto';
import {parseBirthDate,readPeopleSpreadsheet} from '../lib/admin/spreadsheet.ts';
import {createSession,validSession,verifyCredentials,sameOrigin} from '../lib/admin/auth.ts';
import {mergePeople,personId} from '../lib/people-directory.ts';

const salt=randomBytes(16);process.env.ADMIN_EMAIL='staff@example.com';
process.env.ADMIN_PASSWORD_HASH=`${salt.toString('hex')}:${scryptSync('test-only-password',salt,64).toString('hex')}`;
process.env.ADMIN_SESSION_SECRET=randomBytes(32).toString('hex');
const opts={dateOrder:'mdy'};

test('staff sessions reject tampering, expiry, and password rotation',()=>{
 const token=createSession(1000);assert.equal(validSession(token,1001),true);
 assert.equal(validSession(token+'x',1001),false);assert.equal(validSession(token,1000+8*3600000),false);
 const previous=process.env.ADMIN_PASSWORD_HASH;process.env.ADMIN_PASSWORD_HASH+='x';assert.equal(validSession(token,1001),false);process.env.ADMIN_PASSWORD_HASH=previous;
 assert.equal(verifyCredentials('staff@example.com','test-only-password'),true);
 assert.equal(verifyCredentials('other@example.com','test-only-password'),false);
 assert.equal(verifyCredentials('staff@example.com','wrong'),false);
});
test('mutations reject absent and cross-site origins',()=>{
 assert.equal(sameOrigin(new Request('https://example.com/api/admin/import')),false);
 assert.equal(sameOrigin(new Request('https://example.com/api/admin/import',{headers:{Origin:'https://bad.example'}})),false);
 assert.equal(sameOrigin(new Request('https://example.com/api/admin/import',{headers:{Origin:'https://example.com'}})),true);
});
test('birthdays handle actual dates, explicit date order, Excel serial dates and leap days',()=>{
 assert.equal(parseBirthDate('03/04/1940','mdy'),'1940-03-04');
 assert.equal(parseBirthDate('03/04/1940','dmy'),'1940-04-03');
 assert.equal(parseBirthDate('1940-02-29','mdy'),'1940-02-29');
 assert.equal(parseBirthDate('1941-02-29','mdy'),null);
 assert.equal(parseBirthDate('April 3, 1940','mdy'),'1940-04-03');
 assert.equal(parseBirthDate(new Date('1940-04-03T00:00:00Z'),'mdy'),'1940-04-03');
 assert.equal(parseBirthDate(25569,'mdy'),'1970-01-01');
 assert.equal(parseBirthDate('2100-01-01','mdy'),null);
 assert.equal(parseBirthDate('03/04/40','mdy'),null);
});
test('reads 10,000 people from XLSX with familiar column headings',async()=>{
 const book=new ExcelJS.Workbook(),sheet=book.addWorksheet('People');
 sheet.addRow(['First Name','Middle Name','Last Name','DateOfBirth','Other notes']);
 for(let i=0;i<10000;i++)sheet.addRow([`Person ${i}`,'M','Example',new Date('1940-04-03T00:00:00Z'),'Ignored']);
 const buffer=Buffer.from(await book.xlsx.writeBuffer());
 const result=await readPeopleSpreadsheet(buffer,'people.xlsx',opts);
 assert.equal(result.needsColumns,false);assert.equal(result.people.length,10000);assert.equal(result.issues.length,0);
 assert.equal(result.people[9999].name,'Person 9999 M Example');assert.equal(result.people[0].birthDate,'1940-04-03');
});
test('CSV skips invalid dates, supports quoted names, and offers manual column matching',async()=>{
 const csv=Buffer.from('Full Name,DOB\r\n"Example, Ada",1940-04-03\r\nBob,\r\n');
 const result=await readPeopleSpreadsheet(csv,'people.csv',opts);
 assert.equal(result.people[0].name,'Example, Ada');assert.equal(result.issues[0].row,3);
 const custom=Buffer.from('Our relative,Special date\nAda Example,1940-04-03\n');
 assert.equal((await readPeopleSpreadsheet(custom,'people.csv',opts)).needsColumns,true);
 assert.equal((await readPeopleSpreadsheet(custom,'people.csv',{...opts,nameColumn:1,birthColumn:2})).people.length,1);
});
test('search merges Calendar and uploaded records without duplicate reminders',()=>{
 const p={id:'calendar-person',name:'Ada Example',birthDate:'1940-04-03'};
 const duplicate={id:personId(p),name:'ADA  EXAMPLE',birthDate:p.birthDate};
 const different={id:'different',name:p.name,birthDate:'1941-04-03'};
 assert.deepEqual(mergePeople([p],[duplicate,different]),[p,different]);
});
test('rejects oversized and unreadable files instead of silently importing partial data',async()=>{
 await assert.rejects(readPeopleSpreadsheet(Buffer.alloc(4*1024*1024+1),'people.xlsx',opts),/smaller than 4 MB/);
 await assert.rejects(readPeopleSpreadsheet(Buffer.from('not excel'),'people.xlsx',opts),/not a readable Excel file/);
});
