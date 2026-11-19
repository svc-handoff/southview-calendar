import type { Metadata } from 'next';
import { isAdmin } from '@/lib/admin/auth';
import { readSearchSettings } from '@/lib/memorial-settings';
import AdminPanel from './panel';
import {publicSiteHidden} from '@/lib/site-visibility';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Staff — Remember Someone',robots:{index:false,follow:false}};
export default async function AdminPage() {
 const signedIn=await isAdmin();
 const [hidden, settings] = signedIn
  ? await Promise.all([publicSiteHidden(), readSearchSettings().catch(() => null)])
  : [false, null] as const;
 return <AdminPanel signedIn={signedIn} initialPublicHidden={hidden} searchSettings={settings} />;
}
