export type MemorialReminder = { id: string; title: string; date: string };

// Pick the next occurrence of the death anniversary; all-day DTEND is exclusive.
export function memorialDates(deathDate: string, now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const [, month, day] = deathDate.split('-').map(Number);
  const currentYear = Number(today.slice(0, 4));
  for (let year = currentYear; year <= currentYear + 8; year++) {
    const date = new Date(Date.UTC(year, month - 1, day));
    const iso = date.toISOString().slice(0, 10);
    if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || iso < today) continue;
    const start = iso.replaceAll('-', '');
    date.setUTCDate(date.getUTCDate() + 1);
    return { start, end: date.toISOString().slice(0, 10).replaceAll('-', '') };
  }
  throw new Error('Invalid death date.');
}

export function googleMemorialLink(reminder: MemorialReminder, now = new Date()) {
  const { start, end } = memorialDates(reminder.date, now);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: reminder.title,
    dates: `${start}/${end}`,
    recur: 'RRULE:FREQ=YEARLY',
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
