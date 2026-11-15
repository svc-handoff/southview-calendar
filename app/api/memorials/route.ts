export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { allPeople } from '@/lib/people-directory';
import { normalized, searchPeople } from '@/lib/people-search';

export async function GET(request: Request) {
  const query = (new URL(request.url).searchParams.get('name') || '').trim();
  if (normalized(query).length < 3 || query.length > 100) return Response.json({ matches: [], error: 'Enter at least 3 characters.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  try {
    const people = await allPeople();
    if (!people.length) return Response.json({ matches: [], directoryEmpty: true }, { headers: { 'Cache-Control': 'no-store' } });
    return Response.json(searchPeople(people, query), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ matches: [], error: 'Remember Someone is unavailable right now.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
