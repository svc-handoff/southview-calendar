export const dynamic = 'force-dynamic';

// Dedicated demo calendar. The public iCalendar feed is served by Google Calendar.
const calendarId = '53e6a597d415c7a964dedab95a52b0b8459784d885669d4cc40032231e4dbab0@group.calendar.google.com';
const subscribeUrl = 'https://calendar.google.com/calendar/r?cid=' + encodeURIComponent(calendarId);
const manageUrl = 'https://calendar.google.com/calendar/u/0/r?cid=' + encodeURIComponent(calendarId);
const storySlug = (description:string) => description.match(/\[southview-story:([a-z-]+)\]/)?.[1];
const unescapeIcs = (value:string) => value.replace(/\\n/gi,'\n').replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\\\/g,'\\');
const displayTimeZone = 'America/New_York';
const timeFormatter = new Intl.DateTimeFormat('en-US', {timeZone:displayTimeZone,hour:'numeric',minute:'2-digit'});
const dateFormatter = new Intl.DateTimeFormat('en-CA', {timeZone:displayTimeZone,year:'numeric',month:'2-digit',day:'2-digit'});

function parseDateTime(value:string, timeZone:string) {
 const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/.exec(value);
 if(!match)return undefined;
 const [,year,month,day,hour,minute,second='00',utc] = match;
 const wallTime = Date.UTC(+year,+month-1,+day,+hour,+minute,+second);
 if(utc)return new Date(wallTime);
 // Resolve the feed's named time zone using its offset on the event date,
 // rather than assuming Eastern Time is always UTC-4.
 const formatter = new Intl.DateTimeFormat('en-CA', {timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 let instant = wallTime;
 for(let attempt=0;attempt<3;attempt++){
  const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).map(part=>[part.type,part.value]));
  const localTime = Date.UTC(+parts.year,+parts.month-1,+parts.day,+parts.hour,+parts.minute,+parts.second);
  const next = wallTime-(localTime-instant);
  if(next===instant)break;
  instant=next;
 }
 return new Date(instant);
}

function plainDescription(value:string) {
 const entities:Record<string,string> = {nbsp:' ',amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",'#39':"'"};
 return unescapeIcs(value)
  .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'')
  .replace(/<br\s*\/?\s*>|<\/(?:p|div|li|h[1-6])\s*>/gi,'\n')
  .replace(/<[^>]*>/g,'')
  .replace(/&(nbsp|amp|lt|gt|quot|apos|#39);/gi,(_,entity:string)=>entities[entity.toLowerCase()])
  .replace(/\n[ \t]*\n+/g,'\n\n').trim();
}

function parseIcs(ics:string, year:number, month:number){
 const lines=ics.replace(/\r?\n[ \t]/g,'').split(/\r?\n/);
 const calendarTimeZone=lines.find(line=>line.startsWith('X-WR-TIMEZONE:'))?.slice('X-WR-TIMEZONE:'.length)||displayTimeZone;
 const entries:Record<string,string>[]=[];let item:Record<string,string>|null=null;
 for(const line of lines){
  if(line==='BEGIN:VEVENT'){item={};continue;}
  if(line==='END:VEVENT'){if(item)entries.push(item);item=null;continue;}
  if(!item)continue;
  const colon=line.indexOf(':');if(colon<0)continue;
  const [name,...parameters]=line.slice(0,colon).split(';');
  item[name]=line.slice(colon+1);
  const timeZone=parameters.find(parameter=>parameter.startsWith('TZID='));
  if(timeZone)item[`${name}_TZID`]=timeZone.slice(5).replace(/^"|"$/g,'');
 }
 return entries.flatMap((e,index)=>{
  if(!e.DTSTART||e.STATUS==='CANCELLED')return [];
  const raw=e.DTSTART,allDay=/^\d{8}$/.test(raw);
  const start=allDay?undefined:parseDateTime(raw,e.DTSTART_TZID||calendarTimeZone);
  const end=!allDay&&e.DTEND?parseDateTime(e.DTEND,e.DTEND_TZID||e.DTSTART_TZID||calendarTimeZone):undefined;
  if(!allDay&&!start)return [];
  const originalDate=start?dateFormatter.format(start):`${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`;
  const date=e.RRULE?.includes('FREQ=YEARLY')?`${year}-${originalDate.slice(5)}`:originalDate;
  if(Number(date.slice(5,7))!==month||Number(date.slice(0,4))!==year)return [];
  const description=plainDescription(e.DESCRIPTION||''),slug=storySlug(description);
  const time=start?`${end?timeFormatter.formatRange(start,end):timeFormatter.format(start)} ET`:undefined;
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
