'use client';

import { useEffect, useState } from 'react';
import { stories, anniversaries, demoTour, type CalendarEvent } from '@/lib/events';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function historyHref(event: CalendarEvent) {
  return event.storySlug && stories.some((story) => story.slug === event.storySlug)
    ? `/history/${event.storySlug}`
    : null;
}

export default function Home() {
  const [date, setDate] = useState({ year: 2026, month: 9 });
  const [live, setLive] = useState<CalendarEvent[]>([]);
  const [connection, setConnection] = useState('loading');
  const [selectedTour, setSelectedTour] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/calendar?year=${date.year}&month=${date.month + 1}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        setConnection(data.status);
        setLive(data.events || []);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setConnection('error');
      });
    return () => controller.abort();
  }, [date]);

  const histories = anniversaries(date.year);
  const tour = { ...demoTour, kind: 'tour' as const };
  const events = [
    ...histories,
    ...(connection === 'connected' ? live.filter((event) => !histories.some((item) => item.storySlug === event.storySlug)) : [tour]),
  ].filter((event) => event.date.startsWith(`${date.year}-${String(date.month + 1).padStart(2, '0')}-`));
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
      <button className="calendar-event tour-event" key={event.id} onClick={() => setSelectedTour(event)}>
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
          </div>
        </div>
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

      <section className="timeline-section" aria-label="Historical timeline">
        <h2>Timeline</h2>
        <div className="timeline-list">
          {[...stories].sort((a, b) => a.date.localeCompare(b.date)).map((story) => (
            <a className="timeline-story" href={`/history/${story.slug}`} key={story.slug}>
              <time dateTime={story.date}>{story.label}</time>
              <span className="timeline-mark" aria-hidden="true" />
              <span className="timeline-copy">
                <strong>{story.title}</strong>
                <span>{story.summary}</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      {selectedTour && (
        <dialog open className="tour-dialog" onClick={(event) => {
          if (event.target === event.currentTarget) setSelectedTour(null);
        }}>
          <button className="dialog-close" aria-label="Close" onClick={() => setSelectedTour(null)}>×</button>
          <p className="tour-label">Fictional demonstration event</p>
          <h2>{selectedTour.title}</h2>
          <p>{selectedTour.description}</p>
        </dialog>
      )}
    </main>
  );
}
