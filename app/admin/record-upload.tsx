'use client';

import { useRef, useState } from 'react';
import type { MemorialPerson, RecordSource } from '@/lib/memorial-records';

type ImportCounts = { added: number; duplicates: number; skipped: number };
type Preview = ImportCounts & {
  previewId: string;
  preview: MemorialPerson[];
  issues: { row: number; name: string; reason: string }[];
  sheets: string[];
  sheetName: string;
};

const dateLabel = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
function showDate(date?: string) {
  return date ? dateLabel.format(new Date(`${date}T00:00:00Z`)) : '—';
}

export function RecordUpload({ source }: { source: RecordSource }) {
  const burial = source === 'burial';
  const title = burial ? 'Upload burial records' : 'Upload birth and death records';
  const [file, setFile] = useState<File | null>(null);
  const [sheetName, setSheetName] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [done, setDone] = useState<ImportCounts | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function upload(chosenFile: File, sheet: string, approved?: Preview) {
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.set('file', chosenFile);
      form.set('source', source);
      form.set('mode', approved ? 'commit' : 'preview');
      if (sheet) form.set('sheetName', sheet);
      if (approved) form.set('previewId', approved.previewId);
      const response = await fetch('/api/admin/import', { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'The file could not be processed.');
      if (approved) {
        setDone(data);
        setPreview(null);
        setFile(null);
        if (input.current) input.current.value = '';
      } else {
        setPreview(data);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'The upload could not finish. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function chooseFile(chosen: File | null) {
    setFile(chosen);
    setPreview(null);
    setDone(null);
    setError('');
    setSheetName('');
    if (chosen) void upload(chosen, '');
  }

  function downloadIssues() {
    if (!preview) return;
    const quote = (value: string) => '"' + (/^[=+@-]/.test(value) ? "'" : '') + value.replaceAll('"', '""') + '"';
    const content = ['Row,Name,Needs attention', ...preview.issues.map(issue => [String(issue.row), issue.name, issue.reason].map(quote).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${source}-rows-needing-attention.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className="admin-card" aria-label={title}>
      <h2>{title}</h2>
      {burial ? (
        <p>Use exactly two columns, <strong>Name</strong> and <strong>Burial Date</strong>.</p>
      ) : (
        <p>Use <strong>Name, Birthdate, Deathdate</strong> or <strong>DateOfBirth, DateOfDeath, FirstName, LastName, MiddleName</strong>. Each person needs at least one date.</p>
      )}
      <p className="admin-help">Excel or CSV, up to 10,000 rows and 4 MB per file. Use MM/DD/YYYY or YYYY-MM-DD. <a href={`/api/admin/template?source=${source}`}>Download Excel template</a></p>
      <label className="admin-file-label" htmlFor={`${source}-file`}>Choose {burial ? 'a burial' : 'a birth and death'} spreadsheet</label>
      <input ref={input} id={`${source}-file`} type="file" accept=".xlsx,.csv" disabled={busy} onChange={event => chooseFile(event.target.files?.[0] ?? null)} />
      {file && preview && preview.sheets.length > 1 && (
        <div className="admin-options">
          <label htmlFor={`${source}-sheet`}>Sheet to import</label>
          <select id={`${source}-sheet`} value={sheetName || preview.sheetName} disabled={busy} onChange={event => {
            const next = event.target.value;
            setSheetName(next);
            setPreview(null);
            void upload(file, next);
          }}>
            {preview.sheets.map(sheet => <option key={sheet}>{sheet}</option>)}
          </select>
        </div>
      )}
      {busy && !preview && <p role="status">Reading your spreadsheet…</p>}
      {file && !busy && !preview && <button type="button" className="admin-primary" onClick={() => void upload(file, sheetName)}>Try preview again</button>}
      {file && preview && (
        <div className="admin-preview">
          <h3>Check before adding</h3>
          <p><strong>{preview.added.toLocaleString()} new records</strong> · {preview.duplicates.toLocaleString()} already present · {preview.skipped.toLocaleString()} need attention</p>
          {preview.preview.length > 0 && (
            <div className="admin-table-wrap">
              <table>
                <thead><tr><th>Name</th>{burial ? <th>Burial date</th> : <><th>Birthdate</th><th>Deathdate</th></>}</tr></thead>
                <tbody>{preview.preview.map((person, index) => (
                  <tr key={index}>
                    <td>{person.name}</td>
                    {burial ? <td>{showDate(person.burialDate)}</td> : <><td>{showDate(person.birthDate)}</td><td>{showDate(person.deathDate)}</td></>}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {preview.skipped > 0 && <p>Rows needing attention will be skipped. <button className="admin-text-button" onClick={downloadIssues}>Download those rows</button></p>}
          <div className="admin-actions">
            <button type="button" className="admin-primary" disabled={busy || !preview.added} onClick={() => void upload(file, sheetName, preview)}>{busy ? 'Adding records…' : `Add ${preview.added.toLocaleString()} records`}</button>
            <button type="button" disabled={busy} onClick={() => input.current?.click()}>Choose another file</button>
          </div>
        </div>
      )}
      {done && <div className="admin-success" role="status"><h3>Upload complete</h3><p>{done.added.toLocaleString()} records added. {done.duplicates.toLocaleString()} duplicates skipped. {done.skipped.toLocaleString()} rows need attention.</p></div>}
      {error && <p className="admin-error" role="alert">{error}</p>}
    </section>
  );
}
