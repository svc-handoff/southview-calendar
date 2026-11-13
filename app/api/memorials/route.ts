export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { allPeople } from '@/lib/people-directory';
import type { BirthdayPerson } from '@/lib/google-reminders';

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
  if (query.length < 3 || candidate.length < 3) return candidate.startsWith(query) ? 0.88 : 0;
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

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const query = (searchParams.get('name') || '').trim();
  if (query.length < 3 || query.length > 100) return Response.json({ matches: [], error: 'Enter at least 3 characters.' }, { status: 400 });

  try {
    const queryKey = normalized(query);
    const surnameSearch = !queryKey.includes(' ');
    const memorials = await allPeople();
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
      .slice(0, 100)
      .map(({ score: _score, exact: _exact, ...match }) => match);
    return Response.json({ matches: results, matchType: surnameSearch ? 'surname' : 'name', fuzzy: !exactMatches.length && results.length > 0, query }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ matches: [], error: 'Remember Someone is unavailable right now.' }, { status: 503 });
  }
}
