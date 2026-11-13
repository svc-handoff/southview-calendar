import type { Metadata } from 'next';
import { isAdmin } from '@/lib/admin/auth';
import AdminPanel from './panel';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Staff — Remember Someone',robots:{index:false,follow:false}};
export default async function AdminPage() { return <AdminPanel signedIn={await isAdmin()} />; }
