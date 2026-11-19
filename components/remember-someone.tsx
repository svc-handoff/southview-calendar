'use client';

import { useState, type FormEvent } from 'react';
import { anniversaryCalendar, anniversaryReminder, googleMemorialLink, type AnniversaryKind } from '@/lib/google-reminders';
import type { MemorialPerson, SearchSettings } from '@/lib/memorial-records';

type SearchResults = {
  matches: MemorialPerson[];
  burialMatches: MemorialPerson[];
  burialSurname?: string;
  enabled: SearchSettings;
  unavailable: SearchSettings;
};

const dates = [
  { field: 'birthDate', kind: 'birth', label: 'Born' },
  { field: 'deathDate', kind: 'death', label: 'Died' },
  { field: 'burialDate', kind: 'burial', label: 'Buried' },
] as const;

const dateLabel = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });

function download(person: MemorialPerson, kind: AnniversaryKind, date: string) {
  const content = anniversaryCalendar(anniversaryReminder(person, kind, date), kind);
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `south-view-${kind}-${person.id}.ics`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Results({ title, matches, unavailable, surname }: { title: string; matches: MemorialPerson[]; unavailable: boolean; surname?: string }) {
  return (
    <section className="reminder-results" aria-label={title}>
      <h3>{title}</h3>
      {surname && <p className="reminder-message">Showing records with the same last name.</p>}
      {!matches.length && <p className="reminder-message" role="status">{unavailable ? 'This search is temporarily unavailable.' : 'No matching records.'}</p>}
      {matches.map(person => (
        <article className="reminder-match" key={person.id}>
          <strong>{person.name}</strong>
          {dates.map(({ field, kind, label }) => {
            const date = person[field];
            if (!date) return null;
            const reminder = anniversaryReminder(person, kind, date);
            return (
              <div className="reminder-date" key={field}>
                <span>{label} {dateLabel.format(new Date(`${date}T00:00:00Z`))}</span>
                <div className="reminder-export-actions">
                  <a className="google-reminders" href={googleMemorialLink(reminder)} target="_blank" rel="noopener noreferrer" aria-label={`Add ${reminder.title} to Google Calendar`}>Google Calendar ↗</a>
                  <button type="button" className="download-reminders" onClick={() => download(person, kind, date)} aria-label={`Download ${reminder.title}`}>Download .ics</button>
                </div>
              </div>
            );
          })}
        </article>
      ))}
    </section>
  );
}

export function RememberSomeone({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function search(event: FormEvent) {
    event.preventDefault();
    setResults(null);
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`/api/memorials?name=${encodeURIComponent(name)}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Search could not be completed.');
      if (data.hidden || (!data.enabled?.vital && !data.enabled?.burial)) {
        setError('Search is currently unavailable.');
      } else {
        setResults(data);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Search could not be completed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <dialog open className="reminder-dialog" aria-labelledby="reminder-title" onKeyDown={event => { if (event.key === 'Escape') onClose(); }}>
      <button className="dialog-close" aria-label="Close" onClick={onClose}>×</button>
      <h2 id="reminder-title">Remember someone</h2>
      <p className="reminder-help">Find someone and add a yearly reminder. Choose Google Calendar or download an .ics file to import into your calendar app.</p>
      <form className="reminder-search" onSubmit={search}>
        <label htmlFor="memorial-name">Name</label>
        <div className="reminder-search-row">
          <input id="memorial-name" value={name} onChange={event => setName(event.target.value)} autoComplete="off" required minLength={3} maxLength={100} />
          <button type="submit" disabled={loading}>{loading ? 'Searching…' : 'Search'}</button>
        </div>
      </form>
      {error && <p className="reminder-message" role="status">{error}</p>}
      {results?.enabled.vital && <Results title="Birth and death records" matches={results.matches} unavailable={results.unavailable.vital} />}
      {results?.enabled.burial && <Results title="Burial records" matches={results.burialMatches} unavailable={results.unavailable.burial} surname={results.burialSurname} />}
    </dialog>
  );
}
