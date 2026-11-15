import type { Metadata } from 'next';
import { isAdmin } from '@/lib/admin/auth';
import AdminPanel from './panel';
import {publicSiteHidden} from '@/lib/site-visibility';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Staff — Remember Someone',robots:{index:false,follow:false}};
export default async function AdminPage() {
 const signedIn=await isAdmin();
 return <AdminPanel signedIn={signedIn} initialPublicHidden={signedIn?await publicSiteHidden():false}/>;
}
