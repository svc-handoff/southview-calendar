import { isAdmin } from '@/lib/admin/auth';
import { peopleTemplate } from '@/lib/admin/template';
export async function GET(request: Request) {
  if (!await isAdmin()) return new Response('Please sign in.',{status:401});
  const source = new URL(request.url).searchParams.get('source') === 'burial' ? 'burial' : 'vital';
  const workbook = await peopleTemplate(source);
  return new Response(new Uint8Array(workbook),{headers:{
    'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition':`attachment; filename="${source === 'burial' ? 'burials' : 'people'}-template.xlsx"`,
    'Cache-Control':'no-store',
  }});
}
