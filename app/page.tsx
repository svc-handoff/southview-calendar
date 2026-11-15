import Calendar from './calendar';
import {PublicSiteGuard} from '@/components/public-site-guard';
import {publicSiteHidden} from '@/lib/site-visibility';

export const dynamic='force-dynamic';
export default async function Home(){
  const hidden=await publicSiteHidden();
  return <PublicSiteGuard initialHidden={hidden}>{!hidden&&<Calendar/>}</PublicSiteGuard>;
}
