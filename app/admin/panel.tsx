'use client';
import { useRef, useState, type FormEvent } from 'react';

type Person={name:string;birthDate:string};
type Issue={row:number;name:string;reason:string};
type Preview={previewId?:string;added:number;duplicates:number;skipped:number;preview:Person[];issues:Issue[];needsColumns?:boolean;headers:string[];sheets:string[];sheetName:string};
function date(value:string) { return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US',{timeZone:'UTC',month:'long',day:'numeric',year:'numeric'}); }
export default function AdminPanel({signedIn}:{signedIn:boolean}) {
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState('');
 const [busy,setBusy]=useState(false),[file,setFile]=useState<File|null>(null),[preview,setPreview]=useState<Preview|null>(null);
 const dateOrder='mdy';
 const [sheetName,setSheetName]=useState(''),[nameColumn,setNameColumn]=useState(''),[birthColumn,setBirthColumn]=useState('');
 const [done,setDone]=useState<{added:number;duplicates:number;skipped:number}|null>(null);
 const input=useRef<HTMLInputElement>(null);
 async function login(event:FormEvent) {
  event.preventDefault();setBusy(true);setError('');
  try { const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})}),d=await r.json();
   if(!r.ok)throw new Error(d.error);setPassword('');window.location.reload();
  }catch(e){setError(e instanceof Error?e.message:'Could not sign in.');}finally{setBusy(false);}
 }
 function changeFile(value:File|null) {setFile(value);setPreview(null);setDone(null);setError('');setSheetName('');setNameColumn('');setBirthColumn('');}
 async function upload(commit=false) {
  if(!file)return;setBusy(true);setError('');
  try {
   const f=new FormData();f.set('file',file);f.set('mode',commit?'commit':'preview');f.set('dateOrder',dateOrder);
   if(sheetName)f.set('sheetName',sheetName);if(nameColumn)f.set('nameColumn',nameColumn);if(birthColumn)f.set('birthColumn',birthColumn);
   if(commit&&preview?.previewId)f.set('previewId',preview.previewId);
   const r=await fetch('/api/admin/import',{method:'POST',body:f}),d=await r.json();
   if(!r.ok)throw new Error(d.error||'The file could not be processed. Please try again.');
   if(d.done){setDone(d);setPreview(null);setFile(null);if(input.current)input.current.value='';}
   else setPreview(d);
  }catch(e){setError(e instanceof Error?e.message:'The upload could not finish. Please try again.');}finally{setBusy(false);}
 }
 function downloadIssues() {
  if(!preview)return;
  const quote=(v:string)=>`"${(/^[=+@-]/.test(v)?"'":'')+v.replaceAll('"','""')}"`;
  const content=['Row,Name,Needs attention',...preview.issues.map(i=>[String(i.row),i.name,i.reason].map(quote).join(','))].join('\r\n');
  const url=URL.createObjectURL(new Blob(['\ufeff'+content],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='people-needing-attention.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <main className="admin-page">
  <header className="admin-heading"><div><p className="admin-eyebrow">STAFF ONLY</p><h1>Remember someone</h1></div><a href="/">View calendar</a></header>
  {!signedIn?<section className="admin-card admin-signin"><h2>Sign in</h2><form onSubmit={login}>
   <label htmlFor="admin-email">Email</label><input id="admin-email" type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} />
   <label htmlFor="admin-password">Password</label><input id="admin-password" type="password" autoComplete="current-password" required maxLength={300} value={password} onChange={e=>setPassword(e.target.value)} />
   {error&&<p className="admin-error" role="alert">{error}</p>}<button className="admin-primary" disabled={busy}>{busy?'Signing in…':'Sign in'}</button>
  </form></section>:<>
   <div className="admin-session"><span>Private staff uploads</span><button disabled={busy} onClick={async()=>{await fetch('/api/admin/logout',{method:'POST'});window.location.reload();}}>Sign out</button></div>
   <section className="admin-card"><h2>Add people from a spreadsheet</h2><p>Choose an Excel or CSV file with names and birthdays. Up to 10,000 people per file, 4 MB maximum.</p>
    <p className="admin-help">Columns: DateOfBirth, DateOfDeath, FirstName, LastName, MiddleName. Dates use MM/DD/YYYY; MiddleName may be blank. <a href="/api/admin/template">Download Excel template</a></p>
    <label className="admin-file-label" htmlFor="people-file">Choose your spreadsheet</label><input ref={input} id="people-file" type="file" accept=".xlsx,.csv" disabled={busy} onChange={e=>changeFile(e.target.files?.[0]||null)} />
    {file&&preview&&preview.sheets.length>1&&<div className="admin-options">
     {preview && preview.sheets.length>1&&<><label htmlFor="import-sheet">Sheet to import</label><select id="import-sheet" value={sheetName||preview.sheetName} disabled={busy} onChange={e=>{setSheetName(e.target.value);setPreview(null);setNameColumn('');setBirthColumn('');}}>{preview.sheets.map(s=><option key={s}>{s}</option>)}</select></>}
    </div>}
    {preview?.needsColumns&&<div className="admin-column-picker"><h3>Which columns should we use?</h3><p>We couldn’t identify the names and birthdays automatically. Pick the matching headings below.</p>
     <label htmlFor="name-column">Person’s full name</label><select id="name-column" value={nameColumn} onChange={e=>setNameColumn(e.target.value)}><option value="">Choose a column</option>{preview.headers.map((h,i)=><option key={i} value={i+1}>{h}</option>)}</select>
     <label htmlFor="birth-column">Date of birth</label><select id="birth-column" value={birthColumn} onChange={e=>setBirthColumn(e.target.value)}><option value="">Choose a column</option>{preview.headers.map((h,i)=><option key={i} value={i+1}>{h}</option>)}</select>
    </div>}
    {file&&(!preview||preview.needsColumns)&&<button className="admin-primary" disabled={busy||Boolean(preview?.needsColumns&&(!nameColumn||!birthColumn))} onClick={()=>void upload()}>{busy?'Reading spreadsheet…':'Preview people'}</button>}
    {preview?.previewId&&<div className="admin-preview"><h3>Check before adding</h3><p><strong>{preview.added.toLocaleString()} new</strong> · {preview.duplicates.toLocaleString()} already present · {preview.skipped.toLocaleString()} need attention</p>
     <div className="admin-table-wrap"><table><thead><tr><th>Name</th><th>Birthday</th></tr></thead><tbody>{preview.preview.map((p,i)=><tr key={i}><td>{p.name}</td><td>{date(p.birthDate)}</td></tr>)}</tbody></table></div>
     <p className="admin-help">Showing the first {preview.preview.length} valid entries. These birthdays repeat every year.</p>
     {preview.skipped>0&&<p>{preview.skipped.toLocaleString()} rows will be skipped. <button className="admin-text-button" onClick={downloadIssues}>Download rows needing attention</button></p>}
     <div className="admin-actions"><button className="admin-primary" disabled={busy||!preview.added} onClick={()=>void upload(true)}>{busy?'Adding people…':`Add ${preview.added.toLocaleString()} people`}</button><button disabled={busy} onClick={()=>setPreview(null)}>Choose different settings</button></div>
     {busy&&<p role="status">Please keep this page open until the upload finishes. Retrying won’t add duplicates.</p>}
    </div>}
    {done&&<div className="admin-success" role="status"><h3>Upload complete</h3><p>{done.added.toLocaleString()} people added. {done.duplicates.toLocaleString()} duplicates skipped. {done.skipped.toLocaleString()} rows need attention.</p><p>The new people are now available in Remember Someone search.</p></div>}
    {error&&<p className="admin-error" role="alert">{error}</p>}
   </section>
  </>}
 </main>;
}
