import { isAdmin, sameOrigin } from '@/lib/admin/auth';
import { isRecordSource } from '@/lib/memorial-records';
import { setSearchEnabled } from '@/lib/memorial-settings';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Use the admin dashboard to change search settings.' }, { status: 403 });
  if (!await isAdmin()) return Response.json({ error: 'Your session has ended. Please sign in again.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!isRecordSource(body?.source) || typeof body?.enabled !== 'boolean') {
    return Response.json({ error: 'Choose which search to turn on or off.' }, { status: 400 });
  }
  try {
    return Response.json(await setSearchEnabled(body.source, body.enabled), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'The search setting could not be saved. Please try again.' }, { status: 503 });
  }
}
