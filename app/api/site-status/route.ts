import {publicSiteHidden} from '@/lib/site-visibility';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){return Response.json({hidden:await publicSiteHidden()},{headers:{'Cache-Control':'no-store'}});}
