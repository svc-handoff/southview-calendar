'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { calendarEventsForMonth, type CalendarEvent, type HistoricalArticle } from '@/lib/events';
import { birthdayCalendar, birthdayReminder, googleMemorialLink, type BirthdayPerson } from '@/lib/google-reminders';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type MemorialMatch = BirthdayPerson;
function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
}

function linkifyPlainText(text: string, key: string) {
  const links = /(https?:\/\/[^\s<>]+)/g;
  const result: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = links.exec(text))) {
    result.push(text.slice(cursor, match.index));
    const raw = match[1];
    const url = raw.replace(/[.,;:!?)]*$/, '');
    const punctuation = raw.slice(url.length);
    result.push(<span key={`${key}-${index++}`}><a href={url} target="_blank" rel="noreferrer">{url}</a>{punctuation}</span>);
    cursor = links.lastIndex;
  }
  result.push(text.slice(cursor));
  return result;
}

export default function Home() {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  });
  const [live, setLive] = useState<CalendarEvent[]>([]);
  const [calendarArticles,setCalendarArticles] = useState<HistoricalArticle[]>([]);
  const [connection, setConnection] = useState('loading');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showReminderBuilder, setShowReminderBuilder] = useState(false);
  const [lookupName, setLookupName] = useState('');
  const [matches, setMatches] = useState<MemorialMatch[]>([]);
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/calendar?year=${date.year}&month=${date.month + 1}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json() as { status: string; events?: CalendarEvent[]; articles?:HistoricalArticle[] };
        if(!response.ok)throw new Error('Calendar unavailable');
        setConnection(data.status);
        setLive(data.events || []);
        setCalendarArticles(data.articles || []);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setConnection('error');
      });
    return () => controller.abort();
  }, [date]);

  useEffect(() => {
    if (!selectedEvent) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedEvent(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedEvent]);

  const events = calendarEventsForMonth(date.year,date.month+1,live,calendarArticles);
  const offset = new Date(date.year, date.month, 1).getDay();
  const dayCount = new Date(date.year, date.month + 1, 0).getDate();
  const weekCount = Math.ceil((offset + dayCount) / 7);
  const cells = Array.from({ length: weekCount * 7 }, (_, index) => {
    const day = index - offset + 1;
    return day > 0 && day <= dayCount ? day : null;
  });

  function changeMonth(amount: number) {
    const next = new Date(date.year, date.month + amount, 1);
    setDate({ year: next.getFullYear(), month: next.getMonth() });
  }

  function goToToday() {
    const today = new Date();
    setDate({ year: today.getFullYear(), month: today.getMonth() });
  }

  async function searchMemorial() {
    setLookupError('');
    setMatches([]);
    setLookupLoading(true);
    try {
      const response = await fetch(`/api/memorials?name=${encodeURIComponent(lookupName)}`, { cache: 'no-store' });
      const data = await response.json() as { matches?: MemorialMatch[]; error?: string; matchType?: string; fuzzy?: boolean };
      if (!response.ok) throw new Error(data.error || 'Search could not be completed.');
      const found: MemorialMatch[] = data.matches || [];
      setMatches(found);

      if (!found.length) setLookupError('No birthdays found. Try another name.');
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : 'Search could not be completed.');
    } finally {
      setLookupLoading(false);
    }
  }

  function downloadBirthday(person: BirthdayPerson) {
    const blob = new Blob([birthdayCalendar(person)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `south-view-birthday-${person.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.ics`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function renderEvent(event: CalendarEvent) {
    return (
      <button className={`calendar-event ${event.kind === 'tour' ? 'tour-event' : 'history-event'}`} key={event.id} onClick={() => setSelectedEvent(event)}>
        <span className="event-dot" aria-hidden="true" />
        <span>{event.title}</span>
        {event.id === 'demo-tour' && <small>DEMO</small>}
      </button>
    );
  }

  return (
    <main className="home-page">
      <section className="calendar-section" aria-label="Calendar">
        <div className="month-controls">
          <div className="month-navigation">
            <div className="month-buttons">
              <button className="today-button" onClick={goToToday}>Today</button>
              <div className="month-arrows">
                <button aria-label="Previous month" onClick={() => changeMonth(-1)}><ChevronLeft size={20} aria-hidden="true" /></button>
                <button aria-label="Next month" onClick={() => changeMonth(1)}><ChevronRight size={20} aria-hidden="true" /></button>
              </div>
            </div>
            <h1>{months[date.month]} <span>{date.year}</span></h1>
          </div>
          <button className="reminder-button" onClick={() => setShowReminderBuilder(true)}>Remember someone</button>
        </div>
        {connection==='error'&&<p role="status">Google Calendar is unavailable. Reload to try again.</p>}
        <div className="calendar-grid" style={{ gridTemplateRows: `34px repeat(${weekCount}, minmax(84px, 1fr))` }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div className="weekday" key={day}>{day}</div>
          ))}
          {cells.map((day, index) => {
            const dateKey = day
              ? `${date.year}-${String(date.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              : '';
            const dayEvents = events.filter((event) => event.date === dateKey);
            const isToday = day !== null && new Date().toDateString() === new Date(date.year, date.month, day).toDateString();
            return (
              <div className={`calendar-day${day ? '' : ' blank'}`} key={index}>
                {day !== null && (
                  <>
                    <span className={`day-number${isToday ? ' today' : ''}`}>{day}</span>
                    <div className="day-events">{dayEvents.map(renderEvent)}</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {selectedEvent && (
        <div className="event-modal-backdrop" role="presentation" onClick={(event) => {
          if (event.target === event.currentTarget) setSelectedEvent(null);
        }}>
          <section className="event-modal" role="dialog" aria-modal="true" aria-labelledby="selected-event-title">
            <button className="dialog-close" aria-label="Close" onClick={() => setSelectedEvent(null)}>×</button>
            <p className="tour-label">{selectedEvent.kind === 'tour' ? 'Current event' : 'Historical event'}</p>
            <h2 id="selected-event-title">{selectedEvent.title}</h2>
            {selectedEvent.image && <figure className="modal-image">
              <img src={selectedEvent.image} alt={selectedEvent.title} />
            </figure>}
            <div className="modal-copy">
              {(selectedEvent.description || '').split(/\n\s*\n/).map((paragraph, index) => paragraph.trim() && <p style={{whiteSpace:'pre-wrap'}} key={index}>{linkifyPlainText(paragraph, `event-${index}`)}</p>)}
            </div>
            <p className="event-modal-date">{selectedEvent.time ? `${selectedEvent.time} · ` : ''}{formatDate(selectedEvent.kind === 'history' ? selectedEvent.historicalDate || selectedEvent.date : selectedEvent.date)}</p>
            {selectedEvent.location && <p className="event-modal-location">{selectedEvent.location}</p>}
          </section>
        </div>
      )}

      {showReminderBuilder && (
        <dialog open className="reminder-dialog" aria-labelledby="reminder-title" onClick={(event) => {
          if (event.target === event.currentTarget) setShowReminderBuilder(false);
        }}>
          <button className="dialog-close" aria-label="Close" onClick={() => setShowReminderBuilder(false)}>×</button>
          <h2 id="reminder-title">Remember someone</h2>
          <form className="reminder-search" onSubmit={(event) => { event.preventDefault(); void searchMemorial(); }}>
            <label htmlFor="memorial-name">Name</label>
            <div className="reminder-search-row">
                <input id="memorial-name" value={lookupName} onChange={(event) => setLookupName(event.target.value)} autoComplete="off" required minLength={3} maxLength={100} />
              <button type="submit" disabled={lookupLoading}>{lookupLoading ? 'Searching…' : 'Search'}</button>
            </div>
          </form>
          {lookupError && <p className="reminder-message" role="status">{lookupError}</p>}
          {matches.length > 0 && (
            <div className="reminder-results" aria-label="Matching cemetery records">
              <p className="reminder-message">{matches.length} {matches.length === 1 ? 'match' : 'matches'}</p>
              {matches.map((person) => (
                <article className="reminder-match" key={person.id} aria-label={`${person.name}, born ${formatDate(person.birthDate)}`}>
                  <strong>{person.name}</strong>
                  <span>Born {formatDate(person.birthDate)}</span>
                  <div className="reminder-export-actions">
                    <a className="google-reminders" href={googleMemorialLink(birthdayReminder(person))} target="_blank" rel="noopener noreferrer" aria-label={`Add ${person.name}'s birth anniversary to Google Calendar`}>Google Calendar ↗</a>
                    <button type="button" className="download-reminders" onClick={() => downloadBirthday(person)} aria-label={`Download ${person.name}'s birth anniversary`}>Download .ics</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </dialog>
      )}
    </main>
  );
}
