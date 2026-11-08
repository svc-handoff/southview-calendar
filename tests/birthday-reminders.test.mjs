import assert from 'node:assert/strict';
import test from 'node:test';
import { birthdayCalendar, birthdayReminder, googleMemorialLink, memorialDates } from '../lib/google-reminders.ts';
import { parseBirthdayEvents } from '../lib/birthday-calendar.ts';

const now = new Date('2026-11-01T17:00:00Z');
const person = { id: 'lauren-coleman-2011-04-27', name: 'Lauren D. Coleman', birthDate: '2011-04-27' };

test('Google Calendar and ICS use the birthday and repeat yearly', () => {
  const reminder = birthdayReminder(person);
  const google = new URL(googleMemorialLink(reminder, now));
  assert.equal(google.searchParams.get('dates'), '20270427/20270428');
  assert.equal(google.searchParams.get('recur'), 'RRULE:FREQ=YEARLY');
  assert.equal(google.searchParams.get('text'), 'Lauren D. Coleman — birth anniversary');
  const ics = birthdayCalendar(person, now).replace(/\r\n /g, '');
  assert.match(ics, /DTSTART;VALUE=DATE:20270427/);
  assert.match(ics, /DTEND;VALUE=DATE:20270428/);
  assert.match(ics, /RRULE:FREQ=YEARLY/);
  assert.match(ics, /TRIGGER:-P1D/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 1);
  assert.ok(!ics.includes('20270412')); // This person's death anniversary is April 12.
});

test('birthdays today remain today and leap birthdays use the next valid leap day', () => {
  assert.deepEqual(memorialDates('1900-11-01', now), { start: '20261101', end: '20261102' });
  assert.deepEqual(memorialDates('2000-02-29', now), { start: '20280229', end: '20280301' });
});

test('the birthday feed preserves original birth years and excludes cancelled or invalid entries', () => {
  const entry = (date, extra = '') => `BEGIN:VEVENT\r\nDTSTART;VALUE=DATE:${date}\r\nSUMMARY:Lauren D. Coleman\r\nRRULE:FREQ=YEARLY\r\n${extra}END:VEVENT\r\n`;
  const people = parseBirthdayEvents('BEGIN:VCALENDAR\r\n' + entry('20110427') + entry('20110427') + entry('19000229') + entry('20100506', 'STATUS:CANCELLED\r\n') + 'END:VCALENDAR');
  assert.equal(people.length, 1);
  assert.equal(people[0].birthDate, '2011-04-27');
  assert.ok(!('deathDate' in people[0]));
});

test('an imported reminder can start this year and retain the original birth date in its note', () => {
  const feed = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20260427\r\nSUMMARY:Lauren D. Coleman\r\nRRULE:FREQ=YEARLY\r\nDESCRIPTION:Born: 2011-04-27\\nYearly birthday reminder.\r\nEND:VEVENT\r\nEND:VCALENDAR';
  const people = parseBirthdayEvents(feed);
  assert.equal(people.length, 1);
  assert.equal(people[0].birthDate, '2011-04-27');
  assert.equal(new URL(googleMemorialLink(birthdayReminder(people[0]), now)).searchParams.get('dates'), '20270427/20270428');
});
