import research from './research-data.json';

export type Story = {slug:string; title:string; shortTitle:string; date:string; label:string; category:string; summary:string; paragraphs:string[]; image:string; alt:string; credit:string; imageSource:string; source:string; sourceLabel:string; book:string; profile?:boolean; timelineDate?:string; timelineSort?:string};
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

const eventOpenings: Record<string, string> = {
  '1969-01-15': 'On what would have been Martin Luther King Jr.’s 40th birthday, about 300 people gathered at his grave in South-View for a memorial service. The gathering brought the city’s grief back to the place where King had first been laid to rest.',
  '1904-04-03': 'George Graham’s widow was buried at South-View on Easter Sunday, days after her unexpected death. A coroner’s inquiry had raised questions about the circumstances, but no one was ever held responsible.',
  '1886-04-21': 'The state approved the South-View Cemetery Association’s charter after a hearing. With a legal organization in place, the founders could continue receiving burials and building a cemetery owned by Atlanta’s Black community.',
  '1902-05-17': 'A white mob attacked Atlanta’s Pittsburgh neighborhood, killing four Black residents and five white men. Will Richardson, James Harrison, and Milton Risdon, three of the Black victims, were buried at South-View.',
  '1887-07-26': 'Rev. William R. Clemmons, pastor of Mount Olivet Church, died from injuries after a violent assault. Members of his congregation gathered at his home and church, surrounding the family with support.',
  '1905-10-10': 'Amos Rucker, born enslaved, died in Atlanta at age 81. Later accounts have connected him to Civil War service, but those claims remain disputed and cannot be stated as fact.',
  '1944-10-13': 'Walter Westmoreland was killed when his plane was shot down during an escort mission over Germany. He was later buried at South-View, far from the European skies where he served.',
  '1885-10-26': 'Albert Watts watched his father Sterling buried in Rest Haven, the segregated section of Westview Cemetery, from outside the cemetery’s back gate. That indignity helped inspire the effort to establish South-View, a Black-owned cemetery, the following year.',
  '1898-11-09': 'Wade Hampton became the first person executed at Atlanta’s new Fulton County prison, known as the Tower. Crowds gathered near the jail after watching a circus parade, turning the execution into a public spectacle.',
  '1927-11-17': 'A five-year-old great-granddaughter unveiled Bishop Lucius Holsey’s monument at South-View. It honored a church leader who had been born enslaved and helped establish the Colored Methodist Episcopal Church.',
};

// Event-specific second paragraphs add historical context. Citations stay in
// the source line below each article.
const eventContexts: Record<string, string> = {
  '1987-01-03': 'Lewis carried the movement’s demand for political representation into the halls of Congress. From there he continued to press for voting rights and equal treatment, describing that work as part of the same long struggle he had joined as a young organizer.',
  '1969-01-06': 'Andrews helped open professional nursing to Black women at a time when hospitals and training programs often excluded them. Her teaching and organizing strengthened the workforce that cared for Black communities across Georgia.',
  '1994-01-10': 'Dobbs had spent decades building civic organizations and encouraging Black Atlantans to register and vote. Naming a major street for him made his influence visible in the city he helped organize.',
  '1929-01-15': 'King grew up in Atlanta’s Black church community and became a Baptist minister before emerging as a national movement leader. His work linked resistance to segregation with campaigns for economic justice and human dignity.',
  '1969-01-15': 'King had been assassinated in Memphis the previous April. Holding a service at his South-View grave on his birthday brought Atlanta residents together in mourning and kept the cemetery central to the city’s public memory of him.',
  '1983-01-15': 'Jackson’s career joined Black musical life in Atlanta with national audiences. His public performance for Roosevelt’s funeral procession in 1945 made a striking image of a Black musician honoring a president in a country still shaped by segregation.',
  '1933-01-25': 'Pace’s school and home offered Black children in Covington education and care when public institutions routinely denied them equal resources. Her work made teaching a practical form of community building.',
  '1992-02-08': 'Usher led Atlanta’s Black schools during decades when the city maintained separate and unequal systems. She also created opportunities outside the classroom, including Girl Scout troops for Black girls.',
  '1886-02-20': 'The reported purchase marked an early step toward a cemetery owned and governed by Atlanta’s Black community. The founders were responding to segregated burial practices with an institution of their own.',
  '1940-02-21': 'Lewis came of age in the Jim Crow South and chose nonviolent protest while still a student. He later chaired SNCC, marched in Selma, and represented Atlanta in Congress for more than three decades.',
  '1903-02-22': 'Jackson became one of Atlanta’s best-known musicians, moving between church, theatre, radio, and public ceremony. His wide-ranging career preserved a place for Black performance in a segregated cultural landscape.',
  '1908-02-22': 'At the Auburn Avenue Library, McPheeters built a major collection on Black history and literature. By preserving books, papers, and local knowledge, she helped readers encounter histories often left out of public libraries.',
  '1965-03-07': 'Lewis and hundreds of voting-rights marchers set out from Selma for Montgomery. State troopers attacked them on the Edmund Pettus Bridge; the violence drew national attention to the barriers Black citizens faced when trying to vote.',
  '1886-03-18': 'The first reported burials show that South-View was serving families even as its future was being contested. The objection from a neighboring landowner reflected the racial hostility Black Atlantans faced while creating a place of their own.',
  '1904-03-31': 'The unexplained circumstances surrounding Graham’s death led officials to reopen the inquiry, but no clear resolution followed. Her story offers a glimpse of the vulnerability and uncertainty that could shape Black family life in turn-of-the-century Atlanta.',
  '1904-04-03': 'Graham was laid to rest at the cemetery her husband had helped establish. The unresolved inquiry shadowed the burial, while the gathering also connected her family to South-View’s early founding community.',
  '1968-04-04': 'King’s assassination in Memphis prompted grief and unrest across the country. His death came as he was organizing the Poor People’s Campaign, extending the civil-rights movement’s demands to jobs, housing, and economic security.',
  '1945-04-13': 'Jackson played “Going Home” as Roosevelt’s funeral procession passed through Warm Springs. The scene joined a local musician’s artistry to a national moment of mourning, and Jackson’s performance became one of the most remembered episodes of his career.',
  '1886-04-21': 'The approved charter gave the founders a legal framework to operate and hold land collectively. For Atlanta’s Black residents, incorporation helped turn the idea of an independent cemetery into a durable institution.',
  '1900-05-06': 'Butler asked lot owners to keep the grounds cared for, treating maintenance as an expression of respect for the dead. The appeal also reflects how families and community leaders shaped South-View through ongoing stewardship.',
  '1902-05-17': 'The Pittsburgh neighborhood was attacked by a white mob during a period of escalating racial violence in Atlanta. The deaths and the burial of Black victims at South-View connect the cemetery to the city’s painful history of racial terror.',
  '1940-05-17': 'Flipper’s burial in Atlanta brought the story of a pioneering military officer back to the city where he had spent his final days. After graduating from West Point in 1877, he faced racism in the Army and was dismissed from service; decades later, he was formally exonerated.',
  '1915-05-19': 'Turner was a bishop, abolitionist, and outspoken advocate for Black political rights. The enormous turnout for his funeral reflected the reach of his leadership across Atlanta’s churches and communities.',
  '1888-05-22': 'The transfer placed the cemetery acreage in the association’s hands and supported its growth. Land ownership mattered: it gave Black founders greater authority over burial practices and the future of the institution.',
  '1963-06-12': 'Dobbs had led Georgia’s Prince Hall Masons for thirty years and helped build Atlanta’s civic life. The broken-column monument marked a life of service and became part of South-View’s landscape of public memory.',
  '1992-06-17': 'Hamilton entered the Georgia legislature in 1965 as the first Black woman elected to the state’s General Assembly. She had already spent years in education and civil-rights work, and she used public office to challenge discrimination in law and policy.',
  '1858-06-26': 'Herndon was born into slavery and later built a successful barbering and insurance business in Atlanta. Atlanta Life Insurance became a major Black-owned enterprise, creating jobs and helping finance institutions in the city’s Black community.',
  '1933-07-01': 'Young combined classroom teaching with advocacy for children and families. Alongside Andrew Young, she took part in civil-rights work and later focused on improving the lives of children in Atlanta and beyond.',
  '1983-07-06': 'Flanagan was known in Atlanta as a poet, newspaper columnist, and minister. The city’s commemorative day recognized a cultural figure whose writing and public voice connected faith, community, and local life.',
  '2020-07-17': 'Lewis spent his life pressing for a more inclusive democracy, from the Freedom Rides and Selma to his work in Congress. His call to make “good trouble” carried the urgency of the movement into a new generation.',
  '1927-07-21': 'Herndon’s success created a lasting base for Black enterprise in Atlanta. Through Atlanta Life and his philanthropy, he helped support institutions and opportunities during a period when segregation restricted access to capital and public services.',
  '1887-07-26': 'Clemmons’s death after an assault left his congregation grieving and seeking answers. The account captures how violence reached Black religious leaders and how church communities gathered around families in moments of crisis.',
  '1940-08-01': 'Mays led Morehouse for nearly three decades, building the college’s reputation and mentoring generations of students. Martin Luther King Jr. later credited Mays as a major influence on his moral and political outlook.',
  '1893-08-07': 'The trustees’ request described a cemetery serving many poor families during a severe economic downturn. Their appeal shows how South-View balanced its finances while preserving access to burial for people with few resources.',
  '1963-08-28': 'As SNCC chair, Lewis spoke to a quarter-million people gathered for jobs and freedom. He called for urgent federal action against segregation and discrimination, reflecting the movement’s impatience with slow change.',
  '1961-08-30': 'Dobbs organized for Black political power in Atlanta, urging residents to vote and building networks that could influence city decisions. His work helped lay groundwork for the political changes that followed the civil-rights movement.',
  '1994-09-16': 'Young’s work ranged from education and civil-rights organizing to national advocacy for children. Her career showed how the movement’s vision extended beyond ending segregation to improving children’s everyday lives.',
  '1980-09-26': 'The fallen angel became part of South-View’s local lore after cemetery historian Albert Watts noticed its timing. The reported coincidence with Virginia Berry’s death is presented as a family and community story, not as a verified supernatural explanation.',
  '1967-10-07': 'Robinson joined sit-ins and Freedom Rides before becoming SNCC’s executive secretary. She coordinated the demanding logistics behind organizing across the South, work that helped sustain campaigns even as she faced arrest and declining health.',
  '1905-10-10': 'Rucker had been born enslaved and lived through the Civil War and Reconstruction before making a life in Atlanta. Stories of his wartime role have circulated, but the surviving evidence is disputed, so the details should be treated with care.',
  '1905-10-12': 'Rucker was buried at South-View two days after his death. His grave connects the cemetery’s record to the lives of people who survived slavery and shaped Atlanta in the decades that followed.',
  '1944-10-13': 'Westmoreland’s aircraft was shot down during an escort mission over Germany, and he was later buried at South-View. The Tuskegee Airmen were African American military pilots trained at Tuskegee Army Air Field who flew combat and bomber-escort missions while serving in a segregated U.S. Army Air Forces. Their record challenged claims that Black servicemen could not perform demanding combat roles.',
  '1964-10-14': 'King received the Nobel Peace Prize in December, while the October announcement brought his campaign global recognition. He shared the prize money with civil-rights organizations, underscoring that the work belonged to a broad movement rather than one leader alone.',
  '1895-10-21': 'Bowen used the exposition’s Negro Day platform to address the place of Black people in American public life. A theologian and professor, he brought scholarship and religious argument into a period when segregation was being reinforced across the South.',
  '2015-10-25': 'Moving Watts’s remains to South-View brought his story to the cemetery his son Albert and other Black leaders founded. The reinterment linked a family’s experience of segregated burial to the institution created in response.',
  '1885-10-26': 'Watts was buried in Rest Haven, the segregated section of Westview Cemetery. His son Albert watched the burial from outside the main gate; the experience helped spur the effort to create a cemetery where Black families could make their own decisions about burial and remembrance.',
  '1904-11-08': 'Bond became a leading scholar of education and a college president. His research documented the inequalities built into segregated schools and supplied evidence used in legal challenges to those systems.',
  '1898-11-09': 'Hampton’s execution drew a crowd to the new Fulton County prison, where spectators gathered after the circus parade. The episode places South-View’s burial records in the wider, often stark public life of Atlanta at the end of the nineteenth century.',
  '1898-11-10': 'After Hampton’s execution, undertaker L. L. Lee removed his body and arranged the burial at South-View. The next-day interment is a brief entry in the cemetery’s records, set against the spectacle surrounding the execution.',
  '1927-11-17': 'Holsey had been born enslaved and rose to become a bishop and a founder of the Colored Methodist Episcopal Church. The unveiling by his young descendant joined family memory with public recognition of Black religious leadership.',
  '1955-12-05': 'The boycott began after Rosa Parks was arrested for refusing to give up her bus seat. Montgomery residents sustained a yearlong protest, and King emerged as a national leader through the campaign’s organized commitment to nonviolent resistance.',
  '1886-12-06': 'Morgan bought the first shares in the cemetery association, putting money behind the new institution. The investment helped turn a community initiative into an organization capable of managing land and burials.',
  '1964-12-10': 'In his Nobel lecture, King connected nonviolence to the struggle against poverty, colonialism, and racial injustice. He shared the prize funds with organizations doing civil-rights work across the country.',
  '1886-12-17': 'Morgan died soon after investing in the cemetery association and was buried on its grounds. His grave became part of the founding story of South-View, where organizers and families built a lasting institution together.',
  '1972-12-21': 'Bond’s career joined scholarship, college leadership, and research on unequal education. His evidence-based work helped make the harms of school segregation harder for courts and the public to ignore.',
  '1994-12-23': 'McPheeters spent decades making Black history accessible to Atlanta readers through the Auburn Avenue Library. The collections she built continue to support research and preserve the intellectual life of the community.',
  '1885-12-26': 'Usher later became a leading administrator in Atlanta’s Black school system. Her life’s work unfolded when Black educators built strong schools despite unequal funding and the constraints of segregation.',
  '2012-12-31': 'Lewis served in Atlanta public life and education, and her papers are preserved at the Atlanta University Center. The archive allows researchers to trace the work of a Black woman whose political contributions were often overlooked.',
};

export const historicalArticles = research.events.map((event, index) => {
  const slug = eventSlug(event.date, event.title);
  const image = imageForEvent(event);
  return {
    id: `${event.date}-${index}`,
    slug,
    title: event.title,
    date: event.date,
    description: event.description,
    paragraphs: [eventOpenings[event.date] || event.description, eventContexts[event.date] || event.description],
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
