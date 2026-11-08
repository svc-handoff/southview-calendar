import fs from 'node:fs';
import { parseBirthdayEvents } from '../lib/birthday-calendar.ts';

// Run locally with --env-file=.env.development.local. Never log the feed URL.
const expected = JSON.parse(fs.readFileSync(new URL('../data/private/birthdays.json', import.meta.url), 'utf8'));
const feedUrl = process.env.REMEMBER_BIRTHDAY_FEED_URL;
if (!feedUrl) throw new Error('Private birthday feed is not configured.');
let response;
try {
  response = await fetch(feedUrl, { cache: 'no-store', signal: AbortSignal.timeout(20000) });
} catch {
  throw new Error('Private birthday calendar could not be reached.');
}
if (!response.ok) throw new Error(`Birthday feed returned HTTP ${response.status}.`);
const people = parseBirthdayEvents(await response.text());
const key = person => `${person.name}|${person.birthDate}`;
const expectedById = new Map(expected.map(person => [key(person), person]));
const actualById = new Map(people.map(person => [key(person), person]));
const missing = expected.filter(person => !actualById.has(key(person)));
const unexpected = people.filter(person => !expectedById.has(key(person)));
const report = {
  expected: expected.length,
  calendarPeople: people.length,
  matchingNamesAndBirthDates: expected.length - missing.length,
  missing: missing.length,
  unexpected: unexpected.length,
  complete: missing.length === 0 && unexpected.length === 0,
};
console.log(JSON.stringify(report));
process.exitCode = report.complete ? 0 : 1;
