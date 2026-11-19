'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { articleParagraphs } from '@/lib/article-display';
import { ArticleCopy } from '@/components/article-copy';
import { localCalendarDate } from '@/lib/calendar-date';
import { calendarEventsForMonth, type CalendarEvent, type HistoricalArticle } from '@/lib/events';
import { RememberSomeone } from '@/components/remember-someone';
import type { SearchSettings } from '@/lib/memorial-records';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const currentEventLabel = 'Happening at South-View';

function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function Calendar({ searchSettings }: { searchSettings: SearchSettings }) {
  const [date, setDate] = useState<{ year: number; month: number } | null>(null);
  const [today, setToday] = useState<string | null>(null);
  const [live, setLive] = useState<CalendarEvent[]>([]);
  const [calendarArticles,setCalendarArticles] = useState<HistoricalArticle[]>([]);
  const [connection, setConnection] = useState('loading');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showReminderBuilder, setShowReminderBuilder] = useState(false);
  useEffect(() => {
    // Resolve the visitor's date after hydration, never the server's time zone.
    const updateToday = () => {
      const local = localCalendarDate();
      setToday(local.key);
      setDate(current => current ?? { year: local.year, month: local.month });
    };
    updateToday();
    const interval = window.setInterval(updateToday, 60_000);
    window.addEventListener('focus', updateToday);
    document.addEventListener('visibilitychange', updateToday);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', updateToday);
      document.removeEventListener('visibilitychange', updateToday);
    };
  }, []);

  useEffect(() => {
    if (!date) return;
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

  if (!date) return <main className="home-page"><section className="calendar-section" aria-label="Calendar" aria-busy="true" /></main>;

  const events = calendarEventsForMonth(date.year,date.month+1,live,calendarArticles);
  const offset = new Date(date.year, date.month, 1).getDay();
  const dayCount = new Date(date.year, date.month + 1, 0).getDate();
  const weekCount = Math.ceil((offset + dayCount) / 7);
  const cells = Array.from({ length: weekCount * 7 }, (_, index) => {
    const day = index - offset + 1;
    return day > 0 && day <= dayCount ? day : null;
  });

  function changeMonth(amount: number) {
    if (!date) return;
    const next = new Date(date.year, date.month + amount, 1);
    setDate({ year: next.getFullYear(), month: next.getMonth() });
  }

  function goToToday() {
    const local = localCalendarDate();
    setToday(local.key);
    setDate({ year: local.year, month: local.month });
  }

  function renderEvent(event: CalendarEvent) {
    const isCurrent = event.kind === 'tour';
    return (
      <button className={`calendar-event ${isCurrent ? 'tour-event' : 'history-event'}`} key={event.id} onClick={() => setSelectedEvent(event)}>
        <span className="event-dot" aria-hidden="true" />
        <span className="calendar-event-text">
          {isCurrent && <span className="calendar-event-label">{currentEventLabel}</span>}
          {event.title}
        </span>
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
          {(searchSettings.vital || searchSettings.burial) && <button className="reminder-button" onClick={() => setShowReminderBuilder(true)}>Remember someone</button>}
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
            const isToday = day !== null && dateKey === today;
            return (
              <div className={`calendar-day${day ? '' : ' blank'}`} key={index}>
                {day !== null && (
                  <>
                    <span className={`day-number${isToday ? ' today' : ''}`} aria-current={isToday ? 'date' : undefined}>{day}</span>
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
            <p className="tour-label">{selectedEvent.kind === 'tour' ? currentEventLabel : 'Historical event'}</p>
            <h2 id="selected-event-title">{selectedEvent.title}</h2>
            {selectedEvent.image && <figure className="modal-image">
              <img src={selectedEvent.image} alt={selectedEvent.title} />
            </figure>}
            <div className="modal-copy">
              <ArticleCopy paragraphs={articleParagraphs(selectedEvent.description || '')} />
            </div>
            <p className="event-modal-date">{selectedEvent.time ? `${selectedEvent.time} · ` : ''}{formatDate(selectedEvent.kind === 'history' ? selectedEvent.historicalDate || selectedEvent.date : selectedEvent.date)}</p>
            {selectedEvent.location && <p className="event-modal-location">{selectedEvent.location}</p>}
          </section>
        </div>
      )}

      {showReminderBuilder && <RememberSomeone onClose={() => setShowReminderBuilder(false)} />}
    </main>
  );
}
