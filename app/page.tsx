'use client';

import { useEffect, useState } from 'react';
import { storiesWithProfiles, historicalArticles, displayHistoricalDate, anniversaries, demoTour, type CalendarEvent } from '@/lib/events';

const regions = [
  {
    id: 'founding',
    title: 'Founding',
    dates: '1885–1886',
    events: [
      { date: 'October 26, 1885', title: 'Sterling Watts and the origins of South-View', href: '/events/1885-10-26-sterling-watts-is-buried-in-segregated-rest-haven' },
    ],
  },
  {
    id: 'civil-rights',
    title: 'Civil Rights',
    dates: '1841–2020',
    events: [
      { date: 'October 14, 1964', title: 'Martin Luther King Jr. receives the Nobel Peace Prize', href: '/events/1964-10-14-martin-luther-king-jr-is-announced-as-nobel-peace-prize-laureate' },
      { date: 'October 7, 1967', title: 'Ruby Doris Smith Robinson', href: '/events/1967-10-07-ruby-doris-smith-robinson-dies' },
    ],
  },
  {
    id: 'all-events',
    title: 'All Events',
    dates: '1841–2020',
    events: [],
  },
];

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function historyHref(event: CalendarEvent) {
  if (event.articleSlug) return `/events/${event.articleSlug}`;
  return event.storySlug && storiesWithProfiles.some((story) => story.slug === event.storySlug)
    ? `/history/${event.storySlug}`
    : null;
}

export default function Home() {
  const [date, setDate] = useState({ year: 2026, month: 9 });
  const [live, setLive] = useState<CalendarEvent[]>([]);
  const [connection, setConnection] = useState('loading');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

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
        {selectedRegion ? (
          <div className="region-view" key={selectedRegion}>
            <div className="region-view-heading">
              <button className="timeline-back" onClick={() => setSelectedRegion(null)}>← All regions</button>
              <span>{regions.find((region) => region.id === selectedRegion)?.dates}</span>
              <h3>{regions.find((region) => region.id === selectedRegion)?.title}</h3>
            </div>
            <div className="region-event-track">
              <div className="region-event-rail" aria-hidden="true" />
              {[...(selectedRegion === 'all-events'
                ? historicalArticles.map((article) => ({ date: displayHistoricalDate(article.date), title: article.title, href: `/events/${article.slug}`, sort: article.date }))
                : regions.find((region) => region.id === selectedRegion)?.events || []), ...(selectedRegion === 'civil-rights' ? storiesWithProfiles.filter((story) => story.profile).map((story) => ({ date: story.timelineDate || 'Dates not established', title: story.title, href: `/history/${story.slug}`, sort: story.timelineSort || '9999-99-99' })) : [])]
                .sort((a, b) => {
                  const sortA = 'sort' in a ? a.sort : new Date(a.date).toISOString().slice(0, 10);
                  const sortB = 'sort' in b ? b.sort : new Date(b.date).toISOString().slice(0, 10);
                  return sortA.localeCompare(sortB);
                }).map((event) => (
                <a className="timeline-event-card" href={event.href} key={event.href}>
                  <time>{event.date}</time>
                  <strong>{event.title}</strong>
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className="region-track">
            <div className="region-rail" aria-hidden="true" />
            {regions.map((region) => (
              <button className="region-card" key={region.id} onClick={() => setSelectedRegion(region.id)}>
                <span className="region-date">{region.dates}</span>
                <strong>{region.title}</strong>
                <span className="region-open-label">View timeline <span aria-hidden="true">→</span></span>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedEvent && (
        <dialog open className="tour-dialog" onClick={(event) => {
          if (event.target === event.currentTarget) setSelectedEvent(null);
        }}>
          <button className="dialog-close" aria-label="Close" onClick={() => setSelectedEvent(null)}>×</button>
          <p className="tour-label">{selectedEvent.kind === 'tour' ? 'Fictional demonstration event' : selectedEvent.sourceLabel || 'South-View history'}</p>
          <h2>{selectedEvent.title}</h2>
          <p>{selectedEvent.description}</p>
          {selectedEvent.dateNote && <p>{selectedEvent.dateNote}</p>}
          {selectedEvent.source?.startsWith('http') && <p><a href={selectedEvent.source} target="_blank" rel="noreferrer">Source ↗</a></p>}
          {selectedEvent.kind === 'tour' && <p>{demoTour.time} · {demoTour.date}</p>}
        </dialog>
      )}
    </main>
  );
}
