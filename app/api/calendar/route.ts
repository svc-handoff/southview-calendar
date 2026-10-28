import { readCalendarSnapshot } from '@/lib/google-calendar';

export const dynamic = 'force-dynamic';

export async function GET(request:Request){
 const url=new URL(request.url),year=Number(url.searchParams.get('year')),month=Number(url.searchParams.get('month'));
 if(!Number.isInteger(year)||year<1900||year>2200||!Number.isInteger(month)||month<1||month>12)return Response.json({status:'error',message:'Invalid calendar month.'},{status:400});
 try{
  const snapshot=await readCalendarSnapshot(year);
  const prefix=`${year}-${String(month).padStart(2,'0')}-`;
  return Response.json({status:'connected',...snapshot,events:snapshot.events.filter(event=>event.date.startsWith(prefix))},
   {headers:{'Cache-Control':'no-store'}});
 }catch{
  return Response.json({status:'error',events:[],articles:[],message:'Unable to read Google Calendar. Reload to try again.'},
   {status:502,headers:{'Cache-Control':'no-store'}});
 }
}
