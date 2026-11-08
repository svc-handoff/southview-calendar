import type { BirthdayPerson } from './google-reminders.ts';

export function parseBirthdayEvents(ics: string): BirthdayPerson[] {
  const lines = ics.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
  const events: Record<string, string>[] = [];
  let event: Record<string, string> | undefined;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { event = {}; continue; }
    if (line === 'END:VEVENT') { if (event) events.push(event); event = undefined; continue; }
    if (!event) continue;
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    event[line.slice(0, colon).split(';', 1)[0]] = line.slice(colon + 1);
  }
  const unique = new Map<string, BirthdayPerson>();
  for (const item of events) {
    const raw = item.DTSTART || '';
    const name = (item.SUMMARY || '').replace(/\\([nN,;\\])/g, (_, c: string) => /[nN]/.test(c) ? ' ' : c).trim();
    if (item.STATUS === 'CANCELLED' || !/^\d{8}$/.test(raw) || !item.RRULE?.includes('FREQ=YEARLY') || !name) continue;
    const startDate = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    // Imports may start the yearly reminder now while preserving the original
    // birth date in a plain-text note instead of backfilling a century of dates.
    const notes = (item.DESCRIPTION || '').replace(/\\[nN]/g, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
    const recordedBirth = notes.match(/(?:^|\n)\s*Born:\s*(\d{4}-\d{2}-\d{2})(?=\s|$)/i)?.[1];
    const birthDate = recordedBirth && recordedBirth.slice(5) === startDate.slice(5) ? recordedBirth : startDate;
    const day = new Date(`${birthDate}T12:00:00Z`);
    if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== birthDate) continue;
    const key = `${name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()}-${birthDate}`;
    unique.set(key, { id: key, name, birthDate });
  }
  return [...unique.values()];
}
