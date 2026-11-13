import { isAdmin } from '@/lib/admin/auth';
import { peopleTemplate } from '@/lib/admin/template';
export async function GET() {
  if (!await isAdmin()) return new Response('Please sign in.',{status:401});
  const workbook = await peopleTemplate();
  return new Response(new Uint8Array(workbook),{headers:{
    'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition':'attachment; filename="people-template.xlsx"',
    'Cache-Control':'no-store',
  }});
}
