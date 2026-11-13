import { isAdmin, sameOrigin } from '@/lib/admin/auth';
import { maxUploadBytes, readPeopleSpreadsheet, SpreadsheetError } from '@/lib/admin/spreadsheet';
import { calendarPeople, importPeople, personKey, readDirectory, undoImport } from '@/lib/people-directory';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
function reply(body:unknown,status=200) { return Response.json(body,{status,headers:{'Cache-Control':'no-store'}}); }
export async function GET() {
  if (!await isAdmin()) return reply({error:'Please sign in.'},401);
  try { const d=await readDirectory(); return reply({people:d.people.length,imports:d.imports.slice(0,20).map(({addedIds,...rest})=>rest)}); }
  catch { return reply({error:'The directory could not be loaded. Please try again.'},503); }
}
export async function POST(request:Request) {
  if (!sameOrigin(request)) return reply({error:'Please use the upload page on this website.'},403);
  if (!await isAdmin()) return reply({error:'Your session has ended. Please sign in again.'},401);
  try {
    if (Number(request.headers.get('content-length')||0)>maxUploadBytes+50000) return reply({error:'Please choose a file smaller than 4 MB.'},413);
    const form=await request.formData();
    if (form.get('mode')==='undo') {
      const id=String(form.get('id')||''); if (!/^[a-f0-9]{64}$/.test(id)) return reply({error:'Invalid import.'},400);
      return reply({undone:await undoImport(id)});
    }
    const file=form.get('file');
    if (!(file instanceof File) || file.size>maxUploadBytes) return reply({error:'Choose an Excel or CSV file smaller than 4 MB.'},400);
    const col=(name:string) => { const n=Number(form.get(name)); return Number.isInteger(n)&&n>=1&&n<=100?n:undefined; };
    const parsed=await readPeopleSpreadsheet(Buffer.from(await file.arrayBuffer()),file.name,{
      dateOrder:form.get('dateOrder')==='dmy'?'dmy':'mdy',sheetName:String(form.get('sheetName')||'')||undefined,nameColumn:col('nameColumn'),birthColumn:col('birthColumn'),
    });
    if (parsed.needsColumns) return reply(parsed);
    const calendar=await calendarPeople();
    if (form.get('mode')==='commit') {
      if (form.get('previewId')!==parsed.id) return reply({error:'The file or settings changed. Please preview it again.'},400);
      const result=await importPeople({id:parsed.id,fileName:file.name,people:parsed.people,skipped:parsed.issues.length,calendar});
      return reply({done:true,added:result.added,duplicates:result.duplicates,skipped:result.skipped,id:result.id});
    }
    const d=await readDirectory(),known=new Set([...calendar,...d.people].map(personKey));
    let added=0,duplicates=0;
    for (const person of parsed.people) { if (known.has(personKey(person))) duplicates++; else { known.add(personKey(person));added++; } }
    return reply({previewId:parsed.id,rows:parsed.rows,added,duplicates,skipped:parsed.issues.length,preview:parsed.people.slice(0,10),issues:parsed.issues,headers:parsed.headers,sheets:parsed.sheets,sheetName:parsed.sheetName});
  } catch(error) { return reply({error:error instanceof SpreadsheetError?error.message:'The import could not finish. Please try again. Retrying will not add the same people twice.'},error instanceof SpreadsheetError?400:503); }
}
