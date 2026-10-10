export const dynamic = 'force-dynamic';

// Dedicated demo calendar. The public iCalendar feed is served by Google Calendar.
const calendarId = '53e6a597d415c7a964dedab95a52b0b8459784d885669d4cc40032231e4dbab0@group.calendar.google.com';
const subscribeUrl = 'https://calendar.google.com/calendar/r?cid=' + encodeURIComponent(calendarId);
const manageUrl = 'https://calendar.google.com/calendar/u/0/r?cid=' + encodeURIComponent(calendarId);
const storySlug = (description:string) => description.match(/\[southview-story:([a-z-]+)\]/)?.[1];
const unescapeIcs = (value:string) => value.replace(/\\n/gi,'\n').replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\\\/g,'\\');

function parseIcs(ics:string, year:number, month:number){
 const lines=ics.replace(/\r\n[ \t]/g,'').split(/\r?\n/);
 const entries:Record<string,string>[]=[];let item:Record<string,string>|null=null;
 for(const line of lines){
  if(line==='BEGIN:VEVENT'){item={};continue;}
  if(line==='END:VEVENT'){if(item)entries.push(item);item=null;continue;}
  if(!item)continue;
  const colon=line.indexOf(':');if(colon<0)continue;
  item[line.slice(0,colon).split(';')[0]]=line.slice(colon+1);
 }
 return entries.flatMap((e,index)=>{
  if(!e.DTSTART||e.STATUS==='CANCELLED')return [];
  const raw=e.DTSTART,allDay=/^\d{8}$/.test(raw);
  const originalDate=`${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`;
  const date=e.RRULE?.includes('FREQ=YEARLY')?`${year}-${originalDate.slice(5)}`:originalDate;
  if(Number(date.slice(5,7))!==month||Number(date.slice(0,4))!==year)return [];
  const description=unescapeIcs(e.DESCRIPTION||''),slug=storySlug(description);
  const time=allDay?undefined:new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'}).format(new Date(`${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}T${raw.slice(9,11)}:${raw.slice(11,13)}:00${raw.endsWith('Z')?'Z':'-04:00'}`))+' ET';
  return [{id:e.UID||`ics-${index}`,title:unescapeIcs(e.SUMMARY||'Untitled event'),date,description,time,storySlug:slug,kind:slug?'history':'tour',url:e.URL}];
 });
}

export async function GET(request:Request){
 const url=new URL(request.url),year=Number(url.searchParams.get('year')),month=Number(url.searchParams.get('month'));
 if(!Number.isInteger(year)||year<1900||year>2200||!Number.isInteger(month)||month<1||month>12)return Response.json({status:'error',message:'Invalid calendar month.'},{status:400});
 try{
  const response=await fetch(`https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`,{signal:AbortSignal.timeout(10000),headers:{Accept:'text/calendar'}});
  if(!response.ok)throw new Error('Public calendar feed unavailable');
  const ics=await response.text();
  const events=parseIcs(ics,year,month);
  const status=ics.includes('BEGIN:VEVENT')?'connected':'limited';
  return Response.json({status,events,subscribeUrl:status==='connected'?subscribeUrl:undefined,manageUrl,message:status==='limited'?'The demo calendar currently shares free/busy only. Its event details are awaiting public access.':undefined},{headers:{'Cache-Control':'no-store'}});
 }catch{
  return Response.json({status:'error',events:[],message:'Unable to read Google Calendar. Try Refresh.'},{status:502,headers:{'Cache-Control':'no-store'}});
 }
}
