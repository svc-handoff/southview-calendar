import { isAdmin } from '@/lib/admin/auth';
export async function GET() {
  if (!await isAdmin()) return new Response('Please sign in.',{status:401});
  return new Response('Name,Date of birth\r\n',{headers:{'Content-Type':'text/csv;charset=utf-8','Content-Disposition':'attachment; filename="people-template.csv"','Cache-Control':'no-store'}});
}
