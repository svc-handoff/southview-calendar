import research from './research-data.json';

export type Story = {slug:string; title:string; shortTitle:string; date:string; label:string; category:string; summary:string; paragraphs:string[]; image:string; alt:string; credit:string; imageSource:string; source:string; sourceLabel:string; book:string; profile?:boolean; timelineDate?:string; timelineSort?:string};
export const stories: Story[] = [
 {slug:'a-cemetery-of-their-own',title:'A cemetery of their own',shortTitle:'Sterling Watts’s burial',date:'1885-10-26',label:'October 26, 1885',category:'Origins',summary:'A burial under segregation frames the story of South-View’s founding.',paragraphs:[
 'On October 26, 1885, Sterling Watts was buried in Rest Haven, the segregated African American section of Atlanta’s Westview Cemetery. City of the Dead opens with a reconstruction of that day, describing the indignities faced by his family. His son Albert Watts would become one of the six men who founded South-View Cemetery the following year. The burial date is given in the book; Albert’s thoughts in the opening scene are the author’s reconstruction, not a surviving first-person account.',
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

const placeholder = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum.';
export const profiles: Story[] = research.profiles.map((person) => ({
  slug: person.slug,
  title: person.name,
  shortTitle: person.name,
  date: '2000-01-01',
  label: person.name,
  category: 'South-View history',
  summary: person.blurb,
  paragraphs: [placeholder, placeholder],
  image: person.image,
  alt: person.imageStatus === 'permission_required' || person.imageStatus?.includes('permission') || person.imageStatus === 'unavailable_portrait' || person.imageStatus === 'license_review_required' ? 'Portrait pending rights clearance' : person.name,
  credit: person.image === '/images/portrait-pending.svg'
    ? 'Portrait withheld pending rights clearance. View source record.'
    : `${person.credit}${person.license ? ` · ${person.license}` : ''}`,
  imageSource: person.imageSource,
  source: person.imageSource,
  sourceLabel: person.credit,
  book: '',
  profile: true,
  timelineDate: person.timelineDate,
  timelineSort: person.timelineSort,
}));
export const storiesWithProfiles = [...stories, ...profiles];

const genericImage = {
  image: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Unidentified_cemetery_in_Georgia_LCCN99472251.jpg',
  alt: 'An unidentified historic cemetery in Georgia; this is an illustrative image, not South-View Cemetery.',
  imageCredit: 'Unknown photographer; Library of Congress, Prints & Photographs Division, via Wikimedia Commons. Public domain in the United States; published before 1931. Illustrative image, not South-View Cemetery.',
  imageSource: 'https://commons.wikimedia.org/wiki/File:Unidentified_cemetery_in_Georgia_LCCN99472251.jpg',
};
const illustrativeImages = {
  riot: {
    image: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Atlanta_Constitution,_front_page,_September_23,_1906.png',
    alt: 'Front page of The Atlanta Constitution from September 23, 1906, covering the Atlanta race massacre.',
    imageCredit: 'The Atlanta Constitution, front page, September 23, 1906. Public domain in the United States; published before 1931.',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Atlanta_Constitution,_front_page,_September_23,_1906.png',
  },
  airmen: {
    image: 'https://tile.loc.gov/storage-services/service/pnp/fsa/8b29000/8b29200/8b29205r.jpg',
    alt: 'Tuskegee Airmen cadets at training in Tuskegee, Alabama, in 1942.',
    imageCredit: 'U.S. Army Signal Corps; Farm Security Administration–Office of War Information Photograph Collection, Library of Congress. Public domain; no known restrictions.',
    imageSource: 'https://www.loc.gov/item/2017767766/',
  },
  march: {
    image: 'https://cdn.loc.gov/service/pnp/ds/04400/04411v.jpg',
    alt: 'Civil rights marchers gathered at the Lincoln Memorial in Washington, D.C., August 28, 1963.',
    imageCredit: 'Warren K. Leffler, photographer; Library of Congress, Prints & Photographs Division. No known restrictions on publication.',
    imageSource: 'https://www.loc.gov/pictures/item/2013648832/',
  },
};

function eventSlug(date: string, title: string) {
  const titlePart = title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${date}-${titlePart}`;
}

function imageForEvent(event: (typeof research.events)[number]) {
  const title = event.title.toLowerCase();
  if (/atlanta race riot|pittsburgh riot|riot memorial|riot victims/.test(title)) return illustrativeImages.riot;
  if (/tuskegee|westmoreland|airman|airmen/.test(title)) return illustrativeImages.airmen;
  if (/march|selma|bloody sunday|voting-rights|boycott|ruby doris/.test(title)) return illustrativeImages.march;
  const person = profiles.find((profile) => title.includes(profile.title.toLowerCase()));
  if (person && person.image !== '/images/portrait-pending.svg') {
    return { image: person.image, alt: person.alt, imageCredit: person.credit, imageSource: person.imageSource };
  }
  if (person && /civil.rights|movement|segregation|voting/.test(person.summary.toLowerCase())) return illustrativeImages.march;
  if (/martin luther king|\bking\b/.test(title)) {
    const king = profiles.find((profile) => profile.slug === 'martin-luther-king-jr');
    if (king) return { image: king.image, alt: king.alt, imageCredit: king.credit, imageSource: king.imageSource };
  }
  return genericImage;
}

function eventContext(event: (typeof research.events)[number]) {
  const title = event.title.toLowerCase();
  const person = profiles.find((profile) => title.includes(profile.title.toLowerCase()));
  if (person) return person.summary;
  if (/martin luther king|\bking\b/.test(title)) return profiles.find((profile) => profile.slug === 'martin-luther-king-jr')?.summary || '';
  if (event.sourceLabel === 'City of the Dead') {
    return 'The book places this episode within the history of South-View and the people connected to it. Its account preserves the date and context as part of the cemetery’s record of Atlanta’s Black community.';
  }
  return `The source listed below documents this milestone. It is included here alongside South-View’s history and the lives of Atlanta’s civic, cultural, and civil-rights leaders.`;
}

export const historicalArticles = research.events.map((event, index) => {
  const slug = eventSlug(event.date, event.title);
  const image = imageForEvent(event);
  return {
    id: `${event.date}-${index}`,
    slug,
    title: event.title,
    date: event.date,
    description: event.description,
    paragraphs: [event.description, eventContext(event)],
    source: event.source,
    sourceLabel: event.sourceLabel,
    dateNote: event.dateNote,
    storySlug: event.storySlug,
    ...image,
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
