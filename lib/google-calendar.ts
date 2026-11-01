import { dedupeCalendarEvents, type CalendarEvent, type HistoricalArticle } from './events.ts';
import articleAliases from './calendar-article-aliases.json' with { type: 'json' };
import editedImages from './edited-image-assets.json' with { type: 'json' };

// Public event feeds served by Google Calendar. The reminder directory has its
// own separate feed and is read only by /api/memorials.
export const calendarId = '53e6a597d415c7a964dedab95a52b0b8459784d885669d4cc40032231e4dbab0@group.calendar.google.com';
export const currentCalendarId = '4d7c56bc00683a9af3e12f28cb4df46e7e87c0278eb8889b70907704162dcf05@group.calendar.google.com';
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

function imageFromSource(source:string){
 const cached=(editedImages as Record<string,string>)[source];
 if(cached)return cached;
 try{
  const url=new URL(source);
  const commonsFile=url.hostname==='commons.wikimedia.org'&&url.pathname.startsWith('/wiki/File:')
   ? decodeURIComponent(url.pathname.slice('/wiki/File:'.length)) : '';
  const existingImages:Record<string,string>={
   'Johnlewis.jpg':'/images/john-lewis.jpg',
   'Martin_Luther_King_Jr_NYWTS.jpg':'/images/king.jpg',
   'Alonzo_herndon.jpg':'/images/alonzo-herndon.jpg',
   'Benjamin_Mays_portrait.jpg':'/images/benjamin-mays.jpg',
   'Bazoline_Estelle_Usher,_Atlanta_University_student,_half-length_portrait,_facing_front_LCCN98518739.jpg':'/images/bazoline-usher.jpg',
  };
  if(commonsFile)return existingImages[commonsFile]||`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(commonsFile)}`;
  if(!['http:','https:'].includes(url.protocol))return '';
  // The writer's first line may use an image endpoint without a file extension.
  if(url.hostname==='thumb.wikimedia.org')url.hostname='upload.wikimedia.org';
  const gsu=url.hostname==='digitalcollections.library.gsu.edu'&&url.pathname.match(/^\/digital\/api\/collection\/([^/]+)\/id\/([^/]+)\/download$/);
  if(gsu)return `https://digitalcollections.library.gsu.edu/utils/getthumbnail/collection/${gsu[1]}/id/${gsu[2]}`;
  return url.href;
 }catch{/* Invalid or non-image links remain ordinary article text. */}
 return '';
}

function simpleArticle(description:string,title:string,historicalDate:string,slug:string,subjectId:string):HistoricalArticle{
 const parts=description.split('\n');
 let imageSource='';
 if(parts[0]&&/^https?:\/\//i.test(parts[0])){
  const resolved=imageFromSource(parts[0]);
  if(resolved){imageSource=parts.shift()!;}
 }
 const image=imageFromSource(imageSource);
 const paragraphs=parts.join('\n').replace(/^\n/,'').split(/\n[ \t]*\n/).filter(paragraph=>paragraph.trim());
 return {id:slug,slug,subjectId,title,date:historicalDate,description:paragraphs[0]||'',paragraphs,sources:[],
  source:'',sourceLabel:'',legacySlugs:[],storyAliases:[],calendarAliases:[title],storySlug:undefined,
  dateNote:'',image,alt:title,imageCredit:'',imageSource};
}

function readArticle(description:string,title:string):HistoricalArticle|undefined{
 const match=/\[southview-event\]\s*([\s\S]*?)\s*\[\/southview-event\]/.exec(description);
 if(!match)return undefined;
 try{
  const metadata=JSON.parse(match[1]);
  if(metadata.version!==1||typeof metadata.slug!=='string'||!/^[a-z0-9-]+$/.test(metadata.slug)||
    typeof metadata.subjectId!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(metadata.historicalDate))return undefined;
  const stringList=(value:unknown):string[]=>Array.isArray(value)?value.filter(item=>typeof item==='string'):[];
  // Sources stay exactly as the writer placed them in the description. Do not
  // extract or reformat the legacy metadata field into a separate source list.
  const sources:HistoricalArticle['sources']=[];
  // Calendar's rich-text editor may collapse a blank line to one newline.
  const paragraphs=description.slice(0,match.index).trim().split(/\n+/).map(paragraph=>paragraph.trim()).filter(Boolean);
  let image='';
  if(typeof metadata.image==='string'&&metadata.image){
   const imageUrl=new URL(metadata.image,siteOrigin);
   if(imageUrl.origin===siteOrigin&&imageUrl.pathname.startsWith('/images/'))image=imageUrl.pathname;
  }
  return {id:metadata.slug,slug:metadata.slug,subjectId:metadata.subjectId,title,date:metadata.historicalDate,
   description:paragraphs[0]||'',paragraphs,sources,source:'',sourceLabel:'',
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
 const entities:Record<string,string> = {nbsp:' ',amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",'#39':"'",
  mdash:'—',ndash:'–',hellip:'…',lsquo:'‘',rsquo:'’',ldquo:'“',rdquo:'”',bull:'•',copy:'©',reg:'®',trade:'™'};
 return unescapeIcs(value)
  .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'')
  .replace(/<br\s*\/?\s*>/gi,'\n')
  .replace(/<\/(?:p|div|li|h[1-6])\s*>/gi,'\n\n')
  .replace(/<[^>]*>/g,'')
  .replace(/&([a-z]+|#39);/gi,(match,entity:string)=>entities[entity.toLowerCase()]??match)
  .replace(/&#(x[0-9a-f]+|[0-9]+);/gi,(_,value:string)=>String.fromCodePoint(value[0].toLowerCase()==='x'?parseInt(value.slice(1),16):parseInt(value,10)))
  ;
}

function removeGoogleMeetDetails(value:string){
 return value
  .replace(/(?:^|\n)\s*(?:Join with Google Meet|Join a video meeting|Video call link\s*:|Meeting ID\s*:|Join by phone|More phone numbers)[\s\S]*$/i,'')
  .replace(/https?:\/\/meet\.google\.com\/[a-z0-9-]+(?:\?[^\s]*)?/gi,'')
  ;
}

export function parseCalendarFeed(ics:string, year:number, calendarKind?:CalendarEvent['kind']){
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
  const rawDescription=removeGoogleMeetDetails(plainDescription(e.DESCRIPTION||''));
  const title=unescapeIcs(e.SUMMARY||'Untitled event');
  const history=readArticle(rawDescription,title);
  const location=unescapeIcs(e.LOCATION||'').trim();
  const historicalDate=history?.date||originalDate;
  const generatedSlug=historicalDate+'-'+title.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const article=history||(!start&&!location||calendarKind==='tour'?simpleArticle(rawDescription,title,historicalDate,generatedSlug,e.UID||generatedSlug):undefined);
  if(article&&!history){
   const key=(e.UID||'').split('@')[0];
   article.legacySlugs=(articleAliases as Record<string,string[]>)[key]||[];
  }
  const description=article?.imageSource?rawDescription.slice(rawDescription.indexOf('\n')+1).replace(/^\n/,''):
   history?article?.paragraphs.join('\n\n')||rawDescription:rawDescription;
  const slug=history?.storySlug||storySlug(description);
  if(article&&calendarKind!=='tour'){
   const previous=articles.get(article.slug);
   const modified=e['LAST-MODIFIED']||e.DTSTAMP||'';
   if(!previous||modified>previous.modified)articles.set(article.slug,{article,modified});
  }
  const time=start?`${end?timeFormatter.formatRange(start,end):timeFormatter.format(start)} ET`:undefined;
  return [{id:e.UID||`ics-${index}`,title,date,historicalDate,description,image:article?.image,imageSource:article?.imageSource,sources:history?.sources,
   time,location,storySlug:slug,articleSlug:article?.slug,kind:calendarKind||(!time&&!location?'history' as const:'tour' as const),url:e.URL}];
 });
 const canonicalArticles=[...articles.values()].map(value=>value.article);
 return {events:dedupeCalendarEvents(events,canonicalArticles),articles:canonicalArticles};
}

async function publicCalendarFeed(id:string){
 const response=await fetch(`https://calendar.google.com/calendar/ical/${encodeURIComponent(id)}/public/basic.ics`,{
  cache:'no-store',signal:AbortSignal.timeout(10000),headers:{Accept:'text/calendar','Cache-Control':'no-cache'}});
 if(!response.ok)throw new Error('Public calendar feed unavailable');
 const ics=await response.text();
 if(!ics.includes('BEGIN:VCALENDAR'))throw new Error('Invalid calendar feed');
 return ics;
}

export async function readCalendarSnapshot(year:number){
 const [pastFeed,currentFeed]=await Promise.all([publicCalendarFeed(calendarId),publicCalendarFeed(currentCalendarId)]);
 const past=parseCalendarFeed(pastFeed,year,'history');
 const current=parseCalendarFeed(currentFeed,year,'tour');
 const articles=past.articles;
 const events=dedupeCalendarEvents([...past.events,...current.events],articles);
 return {events,articles,subscribeUrl,manageUrl};
}

