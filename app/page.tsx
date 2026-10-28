'use client';

import { useEffect, useState } from 'react';
import { calendarEventsForMonth, type CalendarEvent, type HistoricalArticle } from '@/lib/events';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type MemorialMatch = { id: string; name: string; birthDate: string | null; deathDate: string };
type MemorialSearchType = 'surname' | 'name';
function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
}

function icsEscape(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function foldIcsLine(line: string) {
  const chunks: string[] = [];
  let current = '';
  let length = 0;
  for (const character of line) {
    const bytes = new TextEncoder().encode(character).length;
    if (length + bytes > 73 && current) { chunks.push(current); current = ' '; length = 1; }
    current += character;
    length += bytes;
  }
  chunks.push(current);
  return chunks.join('\r\n');
}

function makeIcsCalendar(name: string, reminders: { title: string; date: string; id: string }[]) {
  const events = reminders.map((reminder) => {
    const [year, month, day] = reminder.date.split('-');
    const start = `${year}${month}${day}`;
    const nextDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + 1));
    const end = `${nextDate.getUTCFullYear()}${String(nextDate.getUTCMonth() + 1).padStart(2, '0')}${String(nextDate.getUTCDate()).padStart(2, '0')}`;
    return [
      'BEGIN:VEVENT',
      `UID:${reminder.id}@southview-calendar`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      'RRULE:FREQ=YEARLY',
      `SUMMARY:${icsEscape(reminder.title)}`,
      'DESCRIPTION:Birth date anniversary from South-View cemetery records. Check family records for date accuracy.',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Birthday reminder for tomorrow',
      'TRIGGER:-P1D',
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n');
  });
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//South-View Cemetery//Memorial Reminders//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${icsEscape(name || 'South-View Reminders')}`,
    ...events,
    'END:VCALENDAR',
    '',
  ].map(foldIcsLine).join('\r\n');
}

function historyHref(event: CalendarEvent) {
  if (event.articleSlug) return `/events/${event.articleSlug}`;
  return null;
}

export default function Home() {
  const [date, setDate] = useState({ year: 2026, month: 9 });
  const [live, setLive] = useState<CalendarEvent[]>([]);
  const [calendarArticles,setCalendarArticles] = useState<HistoricalArticle[]>([]);
  const [connection, setConnection] = useState('loading');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showReminderBuilder, setShowReminderBuilder] = useState(false);
  const [lookupName, setLookupName] = useState('');
  const [matches, setMatches] = useState<MemorialMatch[]>([]);
  const [reminderSelections, setReminderSelections] = useState<Record<string, boolean>>({});
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [matchType, setMatchType] = useState<MemorialSearchType>('name');
  const [fuzzyMatches, setFuzzyMatches] = useState(false);
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
    setReminderSelections({});
    setLookupLoading(true);
    try {
      const response = await fetch(`/api/memorials?name=${encodeURIComponent(lookupName)}`, { cache: 'no-store' });
      const data = await response.json() as { matches?: MemorialMatch[]; error?: string; matchType?: MemorialSearchType; fuzzy?: boolean };
      if (!response.ok) throw new Error(data.error || 'Search could not be completed.');
      const found: MemorialMatch[] = data.matches || [];
      setMatches(found);
      setMatchType(data.matchType || 'name');
      setFuzzyMatches(Boolean(data.fuzzy));
      setReminderSelections(Object.fromEntries(found.map((match) => [match.id, false])));
      if (!found.length) setLookupError('No close matches were found. Try a longer name or a different spelling.');
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : 'Search could not be completed.');
    } finally {
      setLookupLoading(false);
    }
  }

  function selectAllReminders(selected: boolean) {
    setReminderSelections(Object.fromEntries(matches.map((match) => [match.id, selected && Boolean(match.birthDate)])));
  }

  const selectedReminderCount = matches.filter((match) => reminderSelections[match.id] && match.birthDate).length;

  function downloadReminders() {
    const reminders = matches.flatMap((match) => {
      if (!reminderSelections[match.id] || !match.birthDate) return [];
      return [{ title: `Birthday: ${match.name}`, date: match.birthDate, id: `${match.id}-birth` }];
    });
    if (!reminders.length) return;
    const searchLabel = lookupName.trim();
    const blob = new Blob([makeIcsCalendar(`${searchLabel} — South-View Reminders`, reminders)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `south-view-reminders-${searchLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function renderEvent(event: CalendarEvent) {
    const href = historyHref(event);
    if (href) {
      return (
        <a className="calendar-event history-event" href={href} key={event.id}>
          <span className="event-dot" aria-hidden="true" />
          <span>{event.title}</span>
        </a>
      );
    }
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
          <h1>{months[date.month]} <span>{date.year}</span></h1>
          <div className="month-buttons">
            <button aria-label="Previous month" onClick={() => changeMonth(-1)}>‹</button>
            <button className="today-button" onClick={goToToday}>Today</button>
            <button aria-label="Next month" onClick={() => changeMonth(1)}>›</button>
            <button className="reminder-button" onClick={() => setShowReminderBuilder(true)}>Remember someone</button>
          </div>
        </div>
        {connection==='error'&&<p role="status">Google Calendar is unavailable. Reload to try again.</p>}
        <div className="calendar-grid">
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
        <dialog open className="tour-dialog" onClick={(event) => {
          if (event.target === event.currentTarget) setSelectedEvent(null);
        }}>
          <button className="dialog-close" aria-label="Close" onClick={() => setSelectedEvent(null)}>×</button>
          <p className="tour-label">{selectedEvent.kind === 'tour' ? 'Calendar event' : selectedEvent.sourceLabel || 'South-View history'}</p>
          <h2>{selectedEvent.title}</h2>
          <p className="event-description">{selectedEvent.description}</p>
          {selectedEvent.dateNote && <p>{selectedEvent.dateNote}</p>}
          {selectedEvent.source?.startsWith('http') && <p><a href={selectedEvent.source} target="_blank" rel="noreferrer">Source ↗</a></p>}
          {selectedEvent.kind === 'tour' && <p>{selectedEvent.time || 'All day'} · {formatDate(selectedEvent.date)}</p>}
        </dialog>
      )}

      {showReminderBuilder && (
        <dialog open className="reminder-dialog" aria-labelledby="reminder-title" onClick={(event) => {
          if (event.target === event.currentTarget) setShowReminderBuilder(false);
        }}>
          <button className="dialog-close" aria-label="Close" onClick={() => setShowReminderBuilder(false)}>×</button>
          <p className="tour-label">South-View reminders</p>
          <h2 id="reminder-title">Remember someone</h2>
            <p className="reminder-intro">Search a last name to gather a family group, or enter a full name to find one person. Partial names and small spelling differences are matched by closeness. Select any number of people to add their birthdays to one calendar file.</p>
          <form className="reminder-search" onSubmit={(event) => { event.preventDefault(); void searchMemorial(); }}>
            <label htmlFor="memorial-name">Last name or full name</label>
            <div className="reminder-search-row">
                <input id="memorial-name" value={lookupName} onChange={(event) => setLookupName(event.target.value)} autoComplete="off" required minLength={3} maxLength={100} />
              <button type="submit" disabled={lookupLoading}>{lookupLoading ? 'Searching…' : 'Search'}</button>
            </div>
          </form>
          {lookupError && <p className="reminder-message" role="status">{lookupError}</p>}
          {matches.length > 0 && (
            <div className="reminder-results" aria-label="Matching cemetery records">
              <div className="reminder-results-heading">
                <p className="reminder-message">{fuzzyMatches ? `Closest ${matchType === 'surname' ? 'last-name' : 'name'} matches for “${lookupName.trim()}” · ${matches.length} records` : matchType === 'surname' ? `${matches.length} people with last name ${lookupName.trim()}.` : `${matches.length} matching record${matches.length === 1 ? '' : 's'}.`}</p>
                <div className="reminder-bulk-actions">
                  <button type="button" onClick={() => selectAllReminders(true)}>Add all</button>
                  <button type="button" onClick={() => selectAllReminders(false)}>Clear</button>
                </div>
              </div>
              <button type="button" className="download-reminders" onClick={downloadReminders} disabled={!selectedReminderCount}>Download {selectedReminderCount} selected birthday{selectedReminderCount === 1 ? '' : 's'}</button>
              {matches.length > 1 && <p className="reminder-message">{fuzzyMatches ? 'Results are ranked by name similarity; review them before using Add all.' : 'Select a person by clicking anywhere on their card, or use Add all to select everyone with a recorded birth date.'}</p>}
              {matches.map((match) => (
                <button
                  className={`reminder-match${reminderSelections[match.id] ? ' selected' : ''}`}
                  key={match.id}
                  type="button"
                  aria-pressed={Boolean(reminderSelections[match.id])}
                  disabled={!match.birthDate}
                  onClick={() => setReminderSelections((current) => ({ ...current, [match.id]: !current[match.id] }))}
                >
                  <strong>{match.name}</strong>
                  <span>{match.birthDate ? `Birthday · ${formatDate(match.birthDate)}` : 'Birth date not recorded'}</span>
                </button>
              ))}
              <p className="reminder-footnote">Birthdays are added as yearly all-day events with an alert the day before. Some calendar apps may ask you to confirm the import or set alerts after importing.</p>
              <button type="button" className="download-reminders" onClick={downloadReminders} disabled={!selectedReminderCount}>Download {selectedReminderCount} selected birthday{selectedReminderCount === 1 ? '' : 's'}</button>
            </div>
          )}
        </dialog>
      )}
    </main>
  );
}
