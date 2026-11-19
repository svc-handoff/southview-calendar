'use client';

import { useState, type FormEvent } from 'react';
import { RecordUpload } from './record-upload';
import { recordSources, type RecordSource, type SearchSettings } from '@/lib/memorial-records';

export default function AdminPanel({ signedIn, initialPublicHidden, searchSettings }: {
  signedIn: boolean;
  initialPublicHidden: boolean;
  searchSettings: SearchSettings | null;
}) {
 const [publicHidden,setPublicHidden]=useState(initialPublicHidden),[visibilityBusy,setVisibilityBusy]=useState(false),[visibilityError,setVisibilityError]=useState('');
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [enabled, setEnabled] = useState(searchSettings);
 const [searchBusy, setSearchBusy] = useState(false);
 const [searchError, setSearchError] = useState('');
 async function toggleWebsite(){
  setVisibilityBusy(true);setVisibilityError('');
  try{
   const response=await fetch('/api/admin/visibility',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hidden:!publicHidden})});
   const data=await response.json();if(!response.ok)throw new Error(data.error||'The website setting could not be saved.');
   setPublicHidden(data.hidden);
  }catch(e){setVisibilityError(e instanceof Error?e.message:'The website setting could not be saved.');}finally{setVisibilityBusy(false);}
 }
 async function login(event:FormEvent) {
  event.preventDefault();setBusy(true);setError('');
  try { const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})}),d=await r.json();
   if(!r.ok)throw new Error(d.error);setPassword('');window.location.reload();
  }catch(e){setError(e instanceof Error?e.message:'Could not sign in.');}finally{setBusy(false);}
 }
 async function toggleSearch(source: RecordSource) {
  if (!enabled) return;
  setSearchBusy(true);
  setSearchError('');
  try {
   const response = await fetch('/api/admin/memorial-settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, enabled: !enabled[source] }),
   });
   const data = await response.json();
   if (!response.ok) throw new Error(data.error || 'The search setting could not be saved.');
   setEnabled(data);
  } catch (error) {
   setSearchError(error instanceof Error ? error.message : 'The search setting could not be saved.');
  } finally {
   setSearchBusy(false);
  }
 }
 return <main className="admin-page">
  <header className="admin-heading"><div><p className="admin-eyebrow">STAFF ONLY</p><h1>Remember someone</h1></div><a href="/">View calendar</a></header>
  {!signedIn?<section className="admin-card admin-signin"><h2>Sign in</h2><form onSubmit={login}>
   <label htmlFor="admin-email">Email</label><input id="admin-email" type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} />
   <label htmlFor="admin-password">Password</label><input id="admin-password" type="password" autoComplete="current-password" required maxLength={300} value={password} onChange={e=>setPassword(e.target.value)} />
   {error&&<p className="admin-error" role="alert">{error}</p>}<button className="admin-primary" disabled={busy}>{busy?'Signing in…':'Sign in'}</button>
  </form></section>:<>
   <div className="admin-session"><span>Private staff uploads</span><button disabled={busy} onClick={async()=>{await fetch('/api/admin/logout',{method:'POST'});window.location.reload();}}>Sign out</button></div>
   <section className="admin-card"><h2>Website kill switch</h2>
    <p className="admin-help">When on, visitors see a blank page. This dashboard stays available.</p>
    <div className="admin-actions"><button type="button" role="switch" aria-label="Hide public website" aria-checked={publicHidden} className="admin-kill-switch" disabled={visibilityBusy} onClick={()=>void toggleWebsite()}>{visibilityBusy?'Saving…':`Kill switch: ${publicHidden?'ON':'OFF'}`}</button><span role="status">{publicHidden?'Website hidden':'Website visible'}</span></div>
    {visibilityError&&<p className="admin-error" role="alert">{visibilityError}</p>}
   </section>
   <section className="admin-card">
    <h2>Remember Someone searches</h2>
    {!enabled && <p role="status">Search settings could not be loaded. Refresh to try again.</p>}
    {enabled && <div className="admin-actions">
     {recordSources.map(source => {
      const label = source === 'vital' ? 'Birth and death search' : 'Burial search';
      return <button type="button" role="switch" aria-label={label} aria-checked={enabled[source]} className="admin-search-switch" key={source} disabled={searchBusy} onClick={() => void toggleSearch(source)}>{label} {enabled[source] ? 'on' : 'off'}</button>;
     })}
    </div>}
    {searchError && <p className="admin-error" role="alert">{searchError}</p>}
   </section>
   <RecordUpload source="vital" />
   <RecordUpload source="burial" />
  </>}
 </main>;
}
