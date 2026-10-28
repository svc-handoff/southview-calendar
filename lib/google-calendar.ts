import { dedupeCalendarEvents, type CalendarEvent, type HistoricalArticle } from './events.ts';

// Dedicated demo calendar. The public iCalendar feed is served by Google Calendar.
export const calendarId = '53e6a597d415c7a964dedab95a52b0b8459784d885669d4cc40032231e4dbab0@group.calendar.google.com';
const subscribeUrl = 'https://calendar.google.com/calendar/r?cid=' + encodeURIComponent(calendarId);
const manageUrl = 'https://calendar.google.com/calendar/u/0/r?cid=' + encodeURIComponent(calendarId);
const storySlug = (description:string) => description.match(/\[southview-story:([a-z-]+)\]/)?.[1];
const unescapeIcs = (value:string) => value.replace(/\\([nN,;\\])/g,(_,character:string)=>/[nN]/.test(character)?'\n':character);
const displayTimeZone = 'America/New_York';
const timeFormatter = new Intl.DateTimeFormat('en-US', {timeZone:displayTimeZone,hour:'numeric',minute:'2-digit'});
const dateFormatter = new Intl.DateTimeFormat('en-CA', {timeZone:displayTimeZone,year:'numeric',month:'2-digit',day:'2-digit'});
const siteOrigin = 'https://southview-october-stories.cozyyak33.chatgpt.site';

export function calendarArticleDescription(article:HistoricalArticle){
 const metadata={version:1,slug:article.slug,historicalDate:article.date,subjectId:article.subjectId,storySlug:article.storySlug,
  legacySlugs:article.legacySlugs,storyAliases:article.storyAliases,calendarAliases:article.calendarAliases,
  image:article.image?new URL(article.image,siteOrigin).href:'',alt:article.alt,imageCredit:article.imageCredit,
  imageSource:article.imageSource,sources:article.sources,dateNote:article.dateNote||''};
 return `${article.paragraphs.join('\n\n')}\n\n[southview-event]\n${JSON.stringify(metadata,null,2)}\n[/southview-event]`;
}

function readArticle(description:string,title:string):HistoricalArticle|undefined{
 const match=/\[southview-event\]\s*([\s\S]*?)\s*\[\/southview-event\]/.exec(description);
 if(!match)return undefined;
 try{
  const metadata=JSON.parse(match[1]);
  if(metadata.version!==1||typeof metadata.slug!=='string'||!/^[a-z0-9-]+$/.test(metadata.slug)||
    typeof metadata.subjectId!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(metadata.historicalDate))return undefined;
  const stringList=(value:unknown):string[]=>Array.isArray(value)?value.filter(item=>typeof item==='string'):[];
  const sources=Array.isArray(metadata.sources)?metadata.sources.filter((source:{label?:unknown;url?:unknown})=>
    typeof source.label==='string'&&(source.url===null||typeof source.url==='string'&&/^https?:\/\//.test(source.url))):[];
  // Calendar's rich-text editor may collapse a blank line to one newline.
  const paragraphs=description.slice(0,match.index).trim().split(/\n+/).map(paragraph=>paragraph.trim()).filter(Boolean);
  let image='';
  if(typeof metadata.image==='string'&&metadata.image){
   const imageUrl=new URL(metadata.image,siteOrigin);
   if(imageUrl.origin===siteOrigin&&imageUrl.pathname.startsWith('/images/'))image=imageUrl.pathname;
  }
  return {id:metadata.slug,slug:metadata.slug,subjectId:metadata.subjectId,title,date:metadata.historicalDate,
   description:paragraphs[0]||'',paragraphs,sources,source:sources[0]?.url||'',sourceLabel:sources[0]?.label||'',
   legacySlugs:stringList(metadata.legacySlugs),storyAliases:stringList(metadata.storyAliases),
   calendarAliases:[title,...stringList(metadata.calendarAliases)],storySlug:typeof metadata.storySlug==='string'?metadata.storySlug:undefined,
   dateNote:typeof metadata.dateNote==='string'?metadata.dateNote:'',image,
   alt:image&&typeof metadata.alt==='string'?metadata.alt:'',
   imageCredit:image&&typeof metadata.imageCredit==='string'?metadata.imageCredit:'',
   imageSource:image&&typeof metadata.imageSource==='string'&&/^https?:\/\//.test(metadata.imageSource)?metadata.imageSource:''};
 }catch{return undefined;}
}

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

export function parseCalendarFeed(ics:string, year:number){
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
 entries.sort((left,right)=>(right['LAST-MODIFIED']||right.DTSTAMP||'').localeCompare(left['LAST-MODIFIED']||left.DTSTAMP||''));
 const articles=new Map<string,{article:HistoricalArticle;modified:string}>();
 const events:CalendarEvent[]=entries.flatMap((e,index)=>{
  if(!e.DTSTART||e.STATUS==='CANCELLED')return [];
  const raw=e.DTSTART,allDay=/^\d{8}$/.test(raw);
  const start=allDay?undefined:parseDateTime(raw,e.DTSTART_TZID||calendarTimeZone);
  const end=!allDay&&e.DTEND?parseDateTime(e.DTEND,e.DTEND_TZID||e.DTSTART_TZID||calendarTimeZone):undefined;
  if(!allDay&&!start)return [];
  const originalDate=start?dateFormatter.format(start):`${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`;
  const date=e.RRULE?.includes('FREQ=YEARLY')?`${year}-${originalDate.slice(5)}`:originalDate;
  const rawDescription=plainDescription(e.DESCRIPTION||'');
  const history=readArticle(rawDescription,unescapeIcs(e.SUMMARY||'Untitled event'));
  const description=history?.paragraphs.join('\n\n')||rawDescription;
  const slug=history?.storySlug||storySlug(description);
  if(history){
   const previous=articles.get(history.subjectId);
   const modified=e['LAST-MODIFIED']||e.DTSTAMP||'';
   if(!previous||modified>previous.modified)articles.set(history.subjectId,{article:history,modified});
  }
  const time=start?`${end?timeFormatter.formatRange(start,end):timeFormatter.format(start)} ET`:undefined;
  return [{id:e.UID||`ics-${index}`,title:unescapeIcs(e.SUMMARY||'Untitled event'),date,description,time,storySlug:slug,articleSlug:history?.slug,kind:history||slug?'history' as const:'tour' as const,url:e.URL}];
 });
 const canonicalArticles=[...articles.values()].map(value=>value.article);
 return {events:dedupeCalendarEvents(events,canonicalArticles),articles:canonicalArticles};
}

export async function readCalendarSnapshot(year:number){
 const response=await fetch(`https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`,{
  cache:'no-store',signal:AbortSignal.timeout(10000),headers:{Accept:'text/calendar','Cache-Control':'no-cache'}});
 if(!response.ok)throw new Error('Public calendar feed unavailable');
 const ics=await response.text();
 if(!ics.includes('BEGIN:VCALENDAR'))throw new Error('Invalid calendar feed');
 return {...parseCalendarFeed(ics,year),subscribeUrl,manageUrl};
}

