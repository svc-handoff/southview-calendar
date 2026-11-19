import { allPeople } from '@/lib/people-directory';
import { normalized, searchBurials, searchPeople } from '@/lib/people-search';
import { publicSiteHidden } from '@/lib/site-visibility';
import { readSearchSettings } from '@/lib/memorial-settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function reply(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request: Request) {
  if (await publicSiteHidden()) return reply({ matches: [], burialMatches: [], hidden: true });
  const query = (new URL(request.url).searchParams.get('name') || '').trim();
  if (normalized(query).length < 3 || query.length > 100) {
    return reply({ matches: [], error: 'Enter at least 3 characters.' }, 400);
  }
  try {
    const enabled = await readSearchSettings();
    const [vital, burial] = await Promise.allSettled([
      enabled.vital ? allPeople('vital') : [],
      enabled.burial ? allPeople('burial') : [],
    ]);
    const vitalResults = searchPeople(vital.status === 'fulfilled' ? vital.value : [], query);
    const burialResults = searchBurials(burial.status === 'fulfilled' ? burial.value : [], query);
    return reply({
      ...vitalResults,
      enabled,
      burialMatches: burialResults.matches,
      burialSurname: burialResults.surname,
      unavailable: { vital: vital.status === 'rejected', burial: burial.status === 'rejected' },
    });
  } catch {
    return reply({ matches: [], error: 'Remember Someone is unavailable right now.' }, 503);
  }
}
