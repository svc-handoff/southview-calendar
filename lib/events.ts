import research from './research-data.json';
import researched from './researched-content.json';

export type SourceRef = {label:string;url:string|null;note?:string};
export type Story = {slug:string; title:string; shortTitle:string; date:string; label:string; category:string; summary:string; paragraphs:string[]; image:string; alt:string; credit:string; imageSource:string; source:string; sourceLabel:string; book:string; sources?:SourceRef[]; profile?:boolean; timelineDate?:string; timelineSort?:string};
export const stories: Story[] = [
 {slug:'a-cemetery-of-their-own',title:'A cemetery of their own',shortTitle:'Sterling Watts’s burial',date:'1885-10-26',label:'October 26, 1885',category:'Origins',summary:'A burial under segregation frames the story of South-View’s founding.',paragraphs:[
 'On October 26, 1885, Sterling Watts was buried in Rest Haven, the segregated section of Westview Cemetery. His son Albert watched the burial from outside the gate. The experience became part of the family’s determination to create a cemetery where Black Atlantans could bury their loved ones with dignity and control.',
 'South-View was founded in 1886 by formerly enslaved African Americans who objected to their treatment in Atlanta’s segregated burial grounds. It offered Black families greater control over how their loved ones were laid to rest. This October anniversary looks back to the conditions that made such an institution necessary: the struggle for dignity, ownership, and equality extended even to the cemetery. The pictured marker commemorates South-View; it is not Sterling Watts’s grave.'
 ],image:'/images/southview-marker.jpg',alt:'Georgia historical marker describing South-View Cemetery',credit:'From Georgia Historical Society',imageSource:'https://www.georgiahistory.com/ghmi_marker_updated/south-view-cemetery/',source:'https://www.georgiahistory.com/ghmi_marker_updated/south-view-cemetery/',sourceLabel:'Georgia Historical Society',book:'City of the Dead, p. 1 and chapter 1, note 1'},
 {slug:'a-nobel-prize-for-nonviolence',title:'A Nobel Prize for nonviolence',shortTitle:'King’s Nobel announcement',date:'1964-10-14',label:'October 14, 1964',category:'Civil rights',summary:'The world recognizes Martin Luther King Jr.’s nonviolent struggle for equality.',paragraphs:[
 'On October 14, 1964, Martin Luther King Jr. learned that he had been selected for the Nobel Peace Prize. Coretta Scott King called him with the news while he was resting in an Atlanta hospital. The announcement gave international recognition to the nonviolent campaign against racial injustice. King accepted the prize in Oslo on December 10, speaking on behalf of the thousands of people whose work sustained the civil rights movement.',
 'King shared the prize money among civil rights organizations, including the Southern Christian Leadership Conference and the Student Nonviolent Coordinating Committee. His connection to South-View came later: after his assassination in 1968, the cemetery became his original burial place. City of the Dead describes the funeral gathering as the largest in South-View’s history. His remains were subsequently moved, but the cemetery remains part of the story of how Atlanta mourned and remembered him.'
 ],image:'/images/king.jpg',alt:'Portrait of Martin Luther King Jr.',credit:'From the Library of Congress',imageSource:'https://www.loc.gov/resource/ppmsc.01269/',source:'https://kinginstitute.stanford.edu/nobel-peace-prize',sourceLabel:'Stanford’s King Institute',book:'City of the Dead, pp. 114–115'},
 {slug:'remembering-ruby-doris',title:'Remembering Ruby Doris Smith Robinson',shortTitle:'Remembering Ruby Doris',date:'1967-10-07',label:'October 7, 1967',category:'Remembrance',summary:'Honoring the organizer whose work helped keep a movement moving.',paragraphs:[
 'Ruby Doris Smith Robinson died on October 7, 1967, at the age of 25. An Atlanta native and Spelman College graduate, she joined the student sit-ins, participated in the Freedom Rides, and endured imprisonment for challenging segregation. In 1966 she became the Student Nonviolent Coordinating Committee’s executive secretary—the only woman to hold that position. Her short life encompassed both direct action and the demanding daily work of organizing.',
 'Robinson helped coordinate SNCC’s field work across the South, making sure organizers had transportation and the resources they needed. Her death was a profound loss to her colleagues. She is buried at South-View, where her gravestone carries the words, “If you think free, you are free.” This anniversary is a moment to remember a leader whose administrative skill, determination, and courage were essential to the movement’s achievements.'
 ],image:'/images/ruby.jpg',alt:'Ruby Doris Smith Robinson',credit:'From SNCC Digital Gateway / Civil Rights Movement Archive',imageSource:'https://snccdigital.org/people/ruby-doris-smith-robinson/',source:'https://snccdigital.org/people/ruby-doris-smith-robinson/',sourceLabel:'SNCC Digital Gateway',book:'City of the Dead, p. 238'}
];
export const demoTour = {id:'demo-tour',title:'South-View walking tour',date:'2026-10-24',time:'10:00–11:30 a.m. ET',description:'An imagined guided walk through South-View’s history, with stops exploring the cemetery’s origins and its connections to the civil rights movement. Meet at the main entrance, 1990 Jonesboro Road SE, Atlanta. This is a fictional event for demonstration; no tour is scheduled.'};
export type CalendarEvent = {id:string; title:string; date:string; endDate?:string; time?:string; description?:string; url?:string; storySlug?:string; articleSlug?:string; source?:string; sourceLabel?:string; dateNote?:string; kind:'history'|'tour'};

const pendingPortrait = '/images/portrait-pending.svg';
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
  summary: researched.profiles[person.slug]?.paragraphs?.[0] || person.blurb,
  paragraphs: researched.profiles[person.slug]?.paragraphs || [person.blurb],
  image: researched.profiles[person.slug]?.image?.url || pendingPortrait,
  alt: researched.profiles[person.slug]?.image?.url ? researched.profiles[person.slug].image.alt : `Portrait of ${person.name} not shown; reuse rights have not been cleared.`,
  credit: researched.profiles[person.slug]?.image?.url
    ? imageCaption(researched.profiles[person.slug].image)
    : `Portrait not displayed. ${imageCaption(researched.profiles[person.slug]?.image || {})}`,
  imageSource: researched.profiles[person.slug]?.image?.sourcePage || person.imageSource,
  source: person.imageSource,
  sourceLabel: person.credit,
  sources: researched.profiles[person.slug]?.sources || [],
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
export const historicalArticles = research.events.map((event, index) => {
  const slug = eventSlug(event.date, event.title);
  const content = researched.events[event.date];
  const relatedProfile = event.storySlug ? researched.profiles[event.storySlug] : undefined;
  const candidate = content.image;
  const genericCemetery = /unidentified (historic )?(georgia )?cemetery/i.test(candidate.alt);
  const mismatched1906Image = event.date === '1902-05-17' && /1906/.test(candidate.alt);
  const directImage = candidate.url && !genericCemetery && !mismatched1906Image ? candidate : null;
  const personImage = relatedProfile?.image?.url ? relatedProfile.image : null;
  const chosenImage = directImage || personImage;
  const isPersonArticle = !!relatedProfile && event.storySlug !== 'a-cemetery-of-their-own';
  const pendingImage = !chosenImage && isPersonArticle;
  const articleImage = {
    image: chosenImage?.url || (pendingImage ? pendingPortrait : ''),
    alt: chosenImage?.alt || (pendingImage ? 'Portrait not displayed; the silhouette is a placeholder while reuse permission is pending.' : ''),
    imageCredit: chosenImage
      ? imageCaption(chosenImage)
      : `Portrait not displayed. ${imageCaption(candidate)}`,
    imageSource: chosenImage?.sourcePage || candidate.sourcePage,
  };
  return {
    id: `${event.date}-${index}`,
    slug,
    legacySlugs: content.legacySlugs || [],
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
  return research.events.map((event, index) => ({
    id: `${event.date}-${index}`,
    title: event.title,
    date: `${year}${event.date.slice(4)}`,
    description: event.description,
    source: event.source,
    sourceLabel: event.sourceLabel,
    dateNote: event.dateNote,
    storySlug: event.storySlug,
    articleSlug: eventSlug(event.date, event.title),
    kind: 'history',
  }));
}
