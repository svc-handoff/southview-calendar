import research from './research-data.json' with { type: 'json' };
import researched from './researched-content.json' with { type: 'json' };

export type SourceRef = {label:string;url:string|null;note?:string};
type ArticleImage = {url:string|null;alt:string;creator:string;rights:string;sourcePage:string|null};
type ArticleContent = {paragraphs:string[];sources:SourceRef[];image:ArticleImage;dateNote?:string;legacySlugs?:string[];calendarAliases?:string[];storyAliases?:string[]};
const eventContent:Record<string,ArticleContent> = researched.events;
const profileContent:Record<string,ArticleContent> = researched.profiles;
type ResearchEvent = {date:string;title:string;description:string;source:string;sourceLabel:string;dateNote?:string;storySlug?:string;subjectId:string};
const researchEvents:ResearchEvent[] = research.events;
export type Story = {slug:string; title:string; shortTitle:string; date:string; label:string; category:string; summary:string; paragraphs:string[]; image:string; alt:string; credit:string; imageSource:string; source:string; sourceLabel:string; book:string; sources?:SourceRef[]; profile?:boolean; timelineDate?:string; timelineSort?:string};
export const stories: Story[] = [
 {slug:'a-cemetery-of-their-own',title:'A cemetery of their own',shortTitle:'Sterling Watts’s burial',date:'1885-10-26',label:'October 26, 1885',category:'Origins',summary:'A burial under segregation frames the story of South-View’s founding.',paragraphs:[
 'On October 26, 1885, Sterling Watts was buried in Rest Haven, the segregated section of Westview Cemetery. His son Albert watched the burial from outside the gate. The experience became part of the family’s determination to create a cemetery where Black Atlantans could bury their loved ones with dignity and control.',
 'South-View was founded in 1886 by formerly enslaved African Americans who objected to their treatment in Atlanta’s segregated burial grounds. It offered Black families greater control over how their loved ones were laid to rest. This October anniversary looks back to the conditions that made such an institution necessary: the struggle for dignity, ownership, and equality extended even to the cemetery. The pictured marker commemorates South-View; it is not Sterling Watts’s grave.'
 ],image:'',alt:'',credit:'',imageSource:'',source:'https://www.georgiahistory.com/ghmi_marker_updated/south-view-cemetery/',sourceLabel:'Georgia Historical Society',book:'City of the Dead, p. 1 and chapter 1, note 1'},
 {slug:'a-nobel-prize-for-nonviolence',title:'A Nobel Prize for nonviolence',shortTitle:'King’s Nobel announcement',date:'1964-10-14',label:'October 14, 1964',category:'Civil rights',summary:'The world recognizes Martin Luther King Jr.’s nonviolent struggle for equality.',paragraphs:[
 'On October 14, 1964, Martin Luther King Jr. learned that he had been selected for the Nobel Peace Prize. Coretta Scott King called him with the news while he was resting in an Atlanta hospital. The announcement gave international recognition to the nonviolent campaign against racial injustice. King accepted the prize in Oslo on December 10, speaking on behalf of the thousands of people whose work sustained the civil rights movement.',
 'King shared the prize money among civil rights organizations, including the Southern Christian Leadership Conference and the Student Nonviolent Coordinating Committee. His connection to South-View came later: after his assassination in 1968, the cemetery became his original burial place. City of the Dead describes the funeral gathering as the largest in South-View’s history. His remains were subsequently moved, but the cemetery remains part of the story of how Atlanta mourned and remembered him.'
 ],image:'/images/king.jpg',alt:'Martin Luther King Jr.; New York World-Telegram and the Sun Newspaper photograph collection, Library of Congress, public domain',credit:'Dick DeMarsico / Library of Congress; public domain',imageSource:'https://commons.wikimedia.org/wiki/File:Martin_Luther_King_Jr_NYWTS.jpg',source:'https://kinginstitute.stanford.edu/nobel-peace-prize',sourceLabel:'Stanford’s King Institute',book:'City of the Dead, pp. 114–115'},
 {slug:'remembering-ruby-doris',title:'Remembering Ruby Doris Smith Robinson',shortTitle:'Remembering Ruby Doris',date:'1967-10-07',label:'October 7, 1967',category:'Remembrance',summary:'Honoring the organizer whose work helped keep a movement moving.',paragraphs:[
 'Ruby Doris Smith Robinson died on October 7, 1967, at the age of 25. An Atlanta native and Spelman College graduate, she joined the student sit-ins, participated in the Freedom Rides, and endured imprisonment for challenging segregation. In 1966 she became the Student Nonviolent Coordinating Committee’s executive secretary—the only woman to hold that position. Her short life encompassed both direct action and the demanding daily work of organizing.',
 'Robinson helped coordinate SNCC’s field work across the South, making sure organizers had transportation and the resources they needed. Her death was a profound loss to her colleagues. She is buried at South-View, where her gravestone carries the words, “If you think free, you are free.” This anniversary is a moment to remember a leader whose administrative skill, determination, and courage were essential to the movement’s achievements.'
 ],image:'',alt:'',credit:'',imageSource:'',source:'https://snccdigital.org/people/ruby-doris-smith-robinson/',sourceLabel:'SNCC Digital Gateway',book:'City of the Dead, p. 238'}
];
export const demoTour = {id:'demo-tour',title:'South-View walking tour',date:'2026-10-24',time:'10:00–11:30 a.m. ET',description:'An imagined guided walk through South-View’s history, with stops exploring the cemetery’s origins and its connections to the civil rights movement. Meet at the main entrance, 1990 Jonesboro Road SE, Atlanta. This is a fictional event for demonstration; no tour is scheduled.'};
export type CalendarEvent = {id:string; title:string; date:string; historicalDate?:string; endDate?:string; time?:string; location?:string; description?:string; image?:string; imageSource?:string; sources?:SourceRef[]; url?:string; storySlug?:string; articleSlug?:string; source?:string; sourceLabel?:string; dateNote?:string; kind:'history'|'tour'};

function imageCaption(image: { creator?: string; rights?: string }) {
  return `${image.creator || 'Creator not identified'}. ${image.rights || 'Rights status unavailable.'}`;
}
export const profiles: Story[] = research.profiles.map((person) => ({
  slug: person.slug,
  title: person.name,
  shortTitle: person.name,
  date: '2000-01-01',
  label: person.name,
  category: 'South-View history',
  summary: profileContent[person.slug]?.paragraphs?.[0] || person.blurb,
  paragraphs: profileContent[person.slug]?.paragraphs || [person.blurb],
  image: profileContent[person.slug]?.image?.url?.startsWith('/images/') ? profileContent[person.slug].image.url! : '',
  alt: profileContent[person.slug]?.image?.url?.startsWith('/images/') ? profileContent[person.slug].image.alt : '',
  credit: profileContent[person.slug]?.image?.url?.startsWith('/images/')
    ? imageCaption(profileContent[person.slug].image)
    : '',
  imageSource: profileContent[person.slug]?.image?.url?.startsWith('/images/') ? profileContent[person.slug].image.sourcePage || '' : '',
  source: person.imageSource,
  sourceLabel: person.credit,
  sources: profileContent[person.slug]?.sources || [],
  book: '',
  profile: true,
  timelineDate: person.timelineDate,
  timelineSort: person.timelineSort,
}));
export const storiesWithProfiles = [...stories, ...profiles];

function eventSlug(date: string, title: string) {
  const titlePart = title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return date + "-" + titlePart;
}
export const historicalArticles = researchEvents.map((event) => {
  const slug = eventSlug(event.date, event.title);
  const content = eventContent[event.date];
  const relatedProfile = event.storySlug ? profileContent[event.storySlug] : undefined;
  const candidate = content.image;
  const genericCemetery = /unidentified (historic )?(georgia )?cemetery/i.test(candidate.alt);
  const mismatched1906Image = event.date === '1902-05-17' && /1906/.test(candidate.alt);
  const directImage = candidate.url?.startsWith('/images/') && !genericCemetery && !mismatched1906Image ? candidate : null;
  const personImage = relatedProfile?.image?.url?.startsWith('/images/') ? relatedProfile.image : null;
  const chosenImage = directImage || personImage;
  const articleImage = {
    image: chosenImage?.url || '',
    alt: chosenImage?.alt || '',
    imageCredit: chosenImage
      ? imageCaption(chosenImage)
      : '',
    imageSource: chosenImage?.url ? chosenImage.sourcePage || '' : '',
  };
  return {
    id: slug,
    slug,
    legacySlugs: content.legacySlugs || [],
    storyAliases: content.storyAliases || [],
    calendarAliases: [event.title, ...(content.calendarAliases || [])],
    subjectId: event.subjectId,
    title: event.title,
    date: event.date,
    description: event.description,
    paragraphs: content.paragraphs,
    source: event.source,
    sourceLabel: event.sourceLabel,
    sources: content.sources,
    dateNote: content.dateNote || event.dateNote,
    storySlug: event.storySlug,
    ...articleImage,
  };
});

export function displayHistoricalDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function anniversaries(year:number):CalendarEvent[]{
  return historicalArticles.map((article) => ({
    id: article.id,
    title: article.title,
    date: `${year}${article.date.slice(4)}`,
    description: article.description,
    source: article.source,
    sourceLabel: article.sourceLabel,
    dateNote: article.dateNote,
    storySlug: article.storySlug,
    articleSlug: article.slug,
    kind: 'history',
  }));
}

export type HistoricalArticle = typeof historicalArticles[number];

export function resolveHistoricalArticle(reference?:string,articles:HistoricalArticle[]=historicalArticles){
  if(!reference)return undefined;
  let key=reference;
  if(/^https?:\/\//.test(key)){
    try{key=new URL(key).pathname;}catch{return undefined;}
  }
  key=key.replace(/^\/?(?:history|events)\//,'').replace(/^\/+|\/+$/g,'');
  const exact=articles.find(article=>article.slug===key);
  if(exact)return exact;
  const alias=articles.find(article=>[...article.legacySlugs,...article.storyAliases].includes(key));
  if(alias)return alias;
  const personArticles=articles.filter(article=>article.storySlug===key);
  return personArticles.length===1?personArticles[0]:undefined;
}

function calendarTitle(value:string){
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
    .replace(/^(?:(?:historical\s+)?anniversary|birthday|remembering)\s*[:\-–—]?\s*/,'')
    .replace(/[^a-z0-9]+/g,' ').trim();
}
export function dedupeCalendarEvents(events:CalendarEvent[],articles:HistoricalArticle[]=historicalArticles):CalendarEvent[]{
  const historicalTitles=new Map(articles.flatMap(article=>article.calendarAliases.map(title=>[calendarTitle(title),article] as const)));
  const linkedArticle=(event:CalendarEvent)=>{
    if(event.kind==='history'){
      const references=[event.articleSlug,event.url,
        ...(event.description?.match(/https?:\/\/[^\s<>]+\/(?:history|events)\/[a-z0-9-]+/gi)||[])];
      for(const reference of references){const article=resolveHistoricalArticle(reference,articles);if(article)return article;}
      const story=resolveHistoricalArticle(event.storySlug,articles);
      if(story)return story;
      const sameDay=articles.filter(article=>article.storySlug===event.storySlug&&article.date.slice(5)===event.date.slice(5));
      if(event.storySlug&&sameDay.length===1)return sameDay[0];
    }
    return event.kind==='history'||!event.time?historicalTitles.get(calendarTitle(event.title)):undefined;
  };
  const preferred=new Map<string,CalendarEvent>();
  const occurrenceKey=(article:HistoricalArticle,event:CalendarEvent)=>`${article.slug}:${event.date}:${event.time||''}`;
  for(const event of events){
    const article=linkedArticle(event);
    if(!article)continue;
    const key=occurrenceKey(article,event);
    const previous=preferred.get(key);
    if(!previous||(previous.articleSlug!==article.slug&&event.articleSlug===article.slug))preferred.set(key,event);
  }
  const result:CalendarEvent[]=[];
  const seenIds=new Set<string>();
  const seenContents=new Set<string>();
  for(const event of events){
    // Deduplicate only copies of the same occurrence on the same calendar
    // date and time. A person's other milestones are independent events.
    const article=linkedArticle(event);
    if(article&&preferred.get(occurrenceKey(article,event))!==event)continue;
    const idKey=`${event.id}:${event.date}:${event.time||''}`;
    const contentKey=article?occurrenceKey(article,event):`${event.kind}:${event.date}:${event.time||''}:${calendarTitle(event.title)}`;
    if(seenIds.has(idKey)||seenContents.has(contentKey))continue;
    seenIds.add(idKey);
    seenContents.add(contentKey);
    result.push(article?{...event,title:article.title,articleSlug:article.slug,storySlug:article.storySlug,kind:'history'}:event);
  }
  return result;
}

export function calendarEventsForMonth(year:number,month:number,events:CalendarEvent[]=[],articles:HistoricalArticle[]=historicalArticles):CalendarEvent[]{
  const prefix=`${year}-${String(month).padStart(2,'0')}-`;
  return dedupeCalendarEvents(events,articles).filter(event=>event.date.startsWith(prefix));
}

export function timelineEntries(startYear:number,endYear:number){
  const articles=historicalArticles.filter(article=>{
    const year=Number(article.date.slice(0,4));
    return year>=startYear&&year<=endYear;
  }).map(article=>({date:displayHistoricalDate(article.date),title:article.title,href:`/events/${article.slug}`,sort:article.date,subjectId:article.subjectId}));
  const biographies=profiles.filter(profile=>!historicalArticles.some(article=>article.storySlug===profile.slug)).filter(profile=>{
    const year=Number((profile.timelineSort||'').slice(0,4));
    return year>=startYear&&year<=endYear;
  }).map(profile=>({date:profile.timelineDate||'Dates not established',title:profile.title,href:`/history/${profile.slug}`,sort:profile.timelineSort||'9999-99-99',subjectId:profile.slug}));
  return [...articles,...biographies].sort((left,right)=>left.sort.localeCompare(right.sort));
}
