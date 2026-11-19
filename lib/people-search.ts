export function normalized(value: string) {
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

export function searchPeople<T extends { name: string }>(memorials: T[], query: string) {
    const queryKey = normalized(query);
    const singleWordSearch = !queryKey.includes(' ');
    const matches = memorials.flatMap((memorial) => {
      const nameKey = normalized(memorial.name);
      const words = nameKey.split(' ');
      const exact = singleWordSearch ? words.includes(queryKey) : nameKey === queryKey;
      const score = exact ? 1 : singleWordSearch ? Math.max(0, ...words.map(word => wordScore(queryKey, word))) : fuzzyNameScore(queryKey, words);
      if (!exact && score < (singleWordSearch ? 0.70 : 0.74)) return [];
      return [{ ...memorial, score, exact }];
    });
    const exactMatches = matches.filter((match) => match.exact);
    const results = (exactMatches.length ? exactMatches : matches)
      .sort((left, right) => right.score - left.score || normalized(right.name).length - normalized(left.name).length || left.name.localeCompare(right.name))
      .slice(0, 100)
      .map(({ score: _score, exact: _exact, ...match }) => match);
    return { matches: results, matchType: singleWordSearch ? 'name-word' : 'name', fuzzy: !exactMatches.length && results.length > 0, query };
}

export function searchBurials<T extends { name: string }>(records: T[], query: string) {
  const { matches } = searchPeople(records, query);
  if (matches.length) return { matches };

  const suffixes = / (jr|sr|ii|iii|iv)$/;
  const words = normalized(query).replace(suffixes, '').split(' ');
  const surname = words.at(-1);
  if (words.length < 2 || !surname || surname.length < 3) return { matches };

  const surnameMatches = records.filter(person => normalized(person.name).replace(suffixes, '').split(' ').at(-1) === surname);
  return { matches: searchPeople(surnameMatches, surname).matches, surname: surnameMatches.length ? surname : undefined };
}
