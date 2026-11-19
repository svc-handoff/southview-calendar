import { readSearchSettings } from '@/lib/memorial-settings';
import { defaultSearchSettings } from '@/lib/memorial-records';
import Calendar from './calendar';
import {PublicSiteGuard} from '@/components/public-site-guard';
import {publicSiteHidden} from '@/lib/site-visibility';

export const dynamic='force-dynamic';
export default async function Home(){
  const hidden=await publicSiteHidden();
  if (hidden) return <PublicSiteGuard initialHidden />;
  const searchSettings = await readSearchSettings().catch(() => defaultSearchSettings);
  return <PublicSiteGuard initialHidden={false}><Calendar searchSettings={searchSettings} /></PublicSiteGuard>;
}
