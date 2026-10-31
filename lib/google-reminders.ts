export type BirthdayReminder = { id: string; title: string; date: string };

// Both export formats start with the next birthday, including the next valid
// leap year for February 29. End dates for all-day events are exclusive.
export function birthdayDates(birthDate: string, now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const [, month, day] = birthDate.split('-').map(Number);
  const currentYear = Number(today.slice(0, 4));
  for (let year = currentYear; year <= currentYear + 8; year++) {
    const date = new Date(Date.UTC(year, month - 1, day));
    const iso = date.toISOString().slice(0, 10);
    if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || iso < today) continue;
    const start = iso.replaceAll('-', '');
    date.setUTCDate(date.getUTCDate() + 1);
    return { start, end: date.toISOString().slice(0, 10).replaceAll('-', '') };
  }
  throw new Error('Invalid birthday date.');
}

export function googleBirthdayLink(reminder: BirthdayReminder, now = new Date()) {
  const { start, end } = birthdayDates(reminder.date, now);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: reminder.title,
    dates: `${start}/${end}`,
    recur: 'RRULE:FREQ=YEARLY',
    details: `Birth date anniversary from South-View cemetery records. Birth date: ${reminder.date}. Check family records for date accuracy.`,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
