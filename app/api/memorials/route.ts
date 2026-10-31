export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public calendar dedicated to the Remember Someone search. Keep entries simple:
// the event title is the person's name, DTSTART is their death anniversary,
// and the event repeats yearly. No description is needed.
const rememberSomeoneCalendarId = '03519069ae99223ac389a67ed584f1f22752a602f6f9b8cb830b60a97576311b@group.calendar.google.com';
type Memorial = { id: string; name: string; deathDate: string };

function normalized(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function editDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row++) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= right.length; column++) {
      const above = previous[column];
      previous[column] = Math.min(previous[column] + 1, previous[column - 1] + 1, diagonal + Number(left[row - 1] !== right[column - 1]));
      diagonal = above;
    }
  }
  return previous[right.length];
}

function wordScore(query: string, candidate: string) {
  if (query === candidate) return 1;
  if (query.length < 3 || candidate.length < 3) return candidate.startsWith(query) || query.startsWith(candidate) ? 0.88 : 0;
  if (candidate.startsWith(query) || query.startsWith(candidate)) return 0.91 + 0.08 * Math.min(query.length, candidate.length) / Math.max(query.length, candidate.length);
  if (candidate.includes(query) || query.includes(candidate)) return 0.85;
  return 1 - editDistance(query, candidate) / Math.max(query.length, candidate.length);
}

function fuzzyNameScore(query: string, candidateWords: string[]) {
  const queryWords = query.split(' ').filter(Boolean);
  if (!queryWords.length) return 0;
  const scores = queryWords.map((word) => Math.max(0, ...candidateWords.map((candidate) => wordScore(word, candidate))));
  if (scores.some((score) => score < 0.65)) return 0;
  return scores.reduce((total, score) => total + score, 0) / scores.length;
}

function unescapeIcs(value: string) {
  return value.replace(/\\([nN,;\\])/g, (_, character: string) => /[nN]/.test(character) ? ' ' : character).trim();
}

function parseRememberSomeoneEvents(ics: string): Memorial[] {
  const lines = ics.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
  const events: Record<string, string>[] = [];
  let event: Record<string, string> | undefined;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { event = {}; continue; }
    if (line === 'END:VEVENT') { if (event) events.push(event); event = undefined; continue; }
    if (!event) continue;
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const property = line.slice(0, colon).split(';', 1)[0];
    event[property] = line.slice(colon + 1);
  }

  const unique = new Map<string, Memorial>();
  for (const item of events) {
    const rawDate = item.DTSTART || '';
    const name = unescapeIcs(item.SUMMARY || '');
    // This calendar is an index of all-day yearly death anniversaries.
    if (!/^\d{8}$/.test(rawDate) || !item.RRULE?.includes('FREQ=YEARLY') || !name) continue;
    const date = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
    const key = `${normalized(name)}-${date}`;
    unique.set(key, { id: key, name, deathDate: date });
  }
  return [...unique.values()];
}

async function getCalendarMemorials(): Promise<Memorial[]> {
  const url = `https://calendar.google.com/calendar/ical/${encodeURIComponent(rememberSomeoneCalendarId)}/public/basic.ics`;
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(12000), headers: { Accept: 'text/calendar', 'Cache-Control': 'no-cache' } });
  if (!response.ok) throw new Error('Remember Someone calendar is unavailable.');
  const ics = await response.text();
  if (!ics.includes('BEGIN:VCALENDAR')) throw new Error('Remember Someone calendar feed is invalid.');
  return parseRememberSomeoneEvents(ics);
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const query = (searchParams.get('name') || '').trim();
  if (query.length < 3 || query.length > 100) return Response.json({ matches: [], error: 'Enter at least 3 characters.' }, { status: 400 });

  try {
    const queryKey = normalized(query);
    const surnameSearch = !queryKey.includes(' ');
    const memorials = await getCalendarMemorials();
    const matches = memorials.flatMap((memorial) => {
      const nameKey = normalized(memorial.name);
      const words = nameKey.split(' ');
      const exact = surnameSearch ? words.at(-1) === queryKey : nameKey === queryKey;
      const score = exact ? 1 : surnameSearch ? wordScore(queryKey, words.at(-1) || '') : fuzzyNameScore(queryKey, words);
      if (!exact && score < (surnameSearch ? 0.70 : 0.74)) return [];
      return [{ ...memorial, score, exact }];
    });
    const exactMatches = matches.filter((match) => match.exact);
    const results = (exactMatches.length ? exactMatches : matches)
      .sort((left, right) => right.score - left.score || normalized(right.name).length - normalized(left.name).length || left.name.localeCompare(right.name))
      .map(({ score: _score, exact: _exact, ...match }) => match);
    return Response.json({ matches: results, matchType: surnameSearch ? 'surname' : 'name', fuzzy: !exactMatches.length && results.length > 0, query }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ matches: [], error: 'The Remember Someone calendar is unavailable right now.' }, { status: 503 });
  }
}
