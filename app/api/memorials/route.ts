export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PersonRow = {
  DateOfBirth: string;
  DateOfDeath: string;
  FirstName: string;
  LastName: string;
  MiddleName: string;
};

// Local-only sanitized data is generated under .local-data (git-ignored).
// The lookup data is imported into this server route and never sent wholesale to the browser.
const dataFiles = import.meta.glob('../../../.local-data/*.json', { eager: true, import: 'default' }) as Record<string, PersonRow[]>;
const localRows = Object.values(dataFiles)[0] || [];

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
      previous[column] = Math.min(
        previous[column] + 1,
        previous[column - 1] + 1,
        diagonal + Number(left[row - 1] !== right[column - 1]),
      );
      diagonal = above;
    }
  }
  return previous[right.length];
}

function wordScore(query: string, candidate: string) {
  if (query === candidate) return 1;
  if (query.length < 3 || candidate.length < 3) {
    return candidate.startsWith(query) || query.startsWith(candidate) ? 0.88 : 0;
  }
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

function parseDate(value: string, minYear: number, maxYear: number) {
  const normalizedValue = value.trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalizedValue);
  const usMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(normalizedValue);
  if (!isoMatch && !usMatch) return null;
  const year = Number(isoMatch ? isoMatch[1] : usMatch?.[3]);
  const month = Number(isoMatch ? isoMatch[2] : usMatch?.[1]);
  const day = Number(isoMatch ? isoMatch[3] : usMatch?.[2]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (year < minYear || year > maxYear || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const query = (searchParams.get('name') || '').trim();
  if (query.length < 3 || query.length > 100) return Response.json({ matches: [], error: 'Enter at least 3 characters.' }, { status: 400 });

  const queryKey = normalized(query);
  const surnameSearch = !queryKey.includes(' ');
  const currentYear = new Date().getFullYear();
  if (!localRows.length) return Response.json({ matches: [], error: 'The local reminder dataset has not been prepared.' }, { status: 503 });

  try {
    const unique = new Map<string, { id: string; name: string; birthDate: string | null; deathDate: string; score: number; exact: boolean }>();
    for (const row of localRows) {
      const firstName = row.FirstName.trim();
      const lastName = row.LastName.trim();
      const middleName = row.MiddleName.trim();
      const displayName = [firstName, middleName, lastName].filter(Boolean).join(' ');
      const firstNameCore = firstName.replace(/\s+[A-Z]\.?(?=\s|$)/g, '').trim();
      const keys = new Set([
        normalized(displayName),
        normalized([firstName, lastName].filter(Boolean).join(' ')),
        normalized([firstNameCore, lastName].filter(Boolean).join(' ')),
      ]);
      const surnameKey = normalized(lastName);
      const exact = surnameSearch ? surnameKey === queryKey : keys.has(queryKey);
      const candidateWords = normalized([firstName, middleName, lastName].filter(Boolean).join(' ')).split(' ');
      const score = exact ? 1 : surnameSearch ? wordScore(queryKey, surnameKey) : fuzzyNameScore(queryKey, candidateWords);
      if (!exact && (surnameSearch ? score < 0.70 : score < 0.74)) continue;
      const deathDate = parseDate(row.DateOfDeath, 1800, currentYear);
      if (!deathDate) continue;
      const birthDate = parseDate(row.DateOfBirth, 1700, currentYear);
      const id = `${normalized(displayName)}-${birthDate || 'unknown'}-${deathDate}`;
      unique.set(id, { id, name: displayName, birthDate, deathDate, score, exact });
    }
    const allMatches = [...unique.values()];
    const exactMatches = allMatches.filter((match) => match.exact);
    const matches = (exactMatches.length ? exactMatches : allMatches)
      .sort((left, right) => right.score - left.score || normalized(right.name).length - normalized(left.name).length || left.name.localeCompare(right.name))
      .map((match) => ({ id: match.id, name: match.name, birthDate: match.birthDate, deathDate: match.deathDate }));
    return Response.json({ matches, matchType: surnameSearch ? 'surname' : 'name', fuzzy: !exactMatches.length && matches.length > 0, query }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ matches: [], error: 'The cemetery records are unavailable right now.' }, { status: 500 });
  }
}
