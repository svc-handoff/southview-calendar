export type MemorialReminder = { id: string; title: string; date: string };
export type BirthdayPerson = { id: string; name: string; birthDate: string };

export function birthdayReminder(person: BirthdayPerson): MemorialReminder {
  return { id: `${person.id}-birth`, title: `${person.name} — birth anniversary`, date: person.birthDate };
}

// Pick the next occurrence of the birthday; all-day DTEND is exclusive.
export function memorialDates(birthDate: string, now = new Date()) {
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
  throw new Error('Invalid birth date.');
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

export function birthdayCalendar(person: BirthdayPerson, now = new Date()) {
  const reminder = birthdayReminder(person);
  const { start, end } = memorialDates(reminder.date, now);
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//South-View Cemetery//Birth Anniversaries//EN',
    'CALSCALE:GREGORIAN', 'X-WR-CALNAME:South-View Birth Anniversaries',
    'BEGIN:VEVENT', `UID:${icsEscape(reminder.id)}@southview-calendar`,
    `DTSTAMP:${now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${end}`,
    'RRULE:FREQ=YEARLY', `SUMMARY:${icsEscape(reminder.title)}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Birth anniversary tomorrow',
    'TRIGGER:-P1D', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR', '',
  ].map(foldIcsLine).join('\r\n');
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
