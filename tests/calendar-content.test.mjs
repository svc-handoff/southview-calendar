import assert from 'node:assert/strict';
import test from 'node:test';
import {historicalArticles,resolveHistoricalArticle,calendarEventsForMonth,timelineEntries} from '../lib/events.ts';
import {calendarArticleDescription,parseCalendarFeed} from '../lib/google-calendar.ts';

const escape=value=>value.replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(',','\\,').replaceAll(';','\\;');
function fold(line){
  const lines=[];let current='';
  for(const character of line){
    if(Buffer.byteLength(current+character)>73){lines.push(current);current=' ';}
    current+=character;
  }
  return [...lines,current].join('\r\n');
}
const feed=entries=>['BEGIN:VCALENDAR','X-WR-TIMEZONE:America/New_York',...entries.flatMap(entry=>['BEGIN:VEVENT',...entry,'END:VEVENT']),'END:VCALENDAR'].map(fold).join('\r\n');
const record=(article,extra={})=>[
  `UID:${extra.id||article.id}`,
  `SUMMARY:${escape(extra.title||article.title)}`,
  `DTSTART;VALUE=DATE:${extra.start||'2026'+article.date.slice(5).replace('-','')}`,
  'RRULE:FREQ=YEARLY',
  `DESCRIPTION:${escape(extra.description||calendarArticleDescription(article))}`,
  `LAST-MODIFIED:${extra.modified||'20261027T000000Z'}`,
];

test('distinct milestones remain separate, with usable articles and images',()=>{
  assert.equal(historicalArticles.length,54);
  assert.equal(new Set(historicalArticles.map(article=>article.slug)).size,54);
  assert.equal(historicalArticles.filter(article=>article.subjectId==='john-lewis').length,5);
  assert.equal(historicalArticles.filter(article=>article.subjectId==='martin-luther-king-jr').length,5);
  for(const article of historicalArticles){
    assert.ok(article.paragraphs.length>=2&&article.paragraphs.length<=3,article.title);
    assert.ok(article.sources.length,article.title);
    assert.ok(!article.image||article.image.startsWith('/images/'));
  }
});

test('all consolidated articles round-trip through folded Google Calendar descriptions',()=>{
  const parsed=parseCalendarFeed(feed(historicalArticles.map(article=>record(article))),2027);
  assert.equal(parsed.events.length,54);
  assert.equal(parsed.articles.length,54);
  for(const article of historicalArticles){
    const actual=parsed.articles.find(item=>item.slug===article.slug);
    assert.deepEqual(actual.paragraphs,article.paragraphs);
    assert.deepEqual(actual.sources,article.sources);
    assert.equal(actual.date,article.date);
    assert.equal(actual.image,article.image);
    assert.equal(actual.dateNote,article.dateNote||'');
  }
});

test('Google Calendar title, copy and anniversary date edits are authoritative',()=>{
  const article=historicalArticles.find(item=>item.date==='1964-10-14');
  const updated=calendarArticleDescription({...article,paragraphs:['Edited in Google Calendar.','The updated story.']});
  const parsed=parseCalendarFeed(feed([record(article,{title:'Updated Calendar title',description:updated,start:'20261015'})]),2026);
  assert.equal(parsed.articles[0].title,'Updated Calendar title');
  assert.deepEqual(parsed.articles[0].paragraphs,['Edited in Google Calendar.','The updated story.']);
  assert.equal(parsed.events[0].date,'2026-10-15');
  assert.equal(parsed.articles[0].date,'1964-10-14');
});

test('Calendar rich-text normalization preserves separate article paragraphs',()=>{
  const article=historicalArticles.find(item=>item.date==='1964-10-14');
  const normalized=calendarArticleDescription(article).replace(/\n\n/g,'\n');
  const parsed=parseCalendarFeed(feed([record(article,{description:normalized})]),2026);
  assert.deepEqual(parsed.articles[0].paragraphs,article.paragraphs);
});

test('a birthday and later milestone survive; a same-day copy is removed',()=>{
  const article=historicalArticles.find(item=>item.date==='1965-03-07');
  const birthday=historicalArticles.find(item=>item.date==='1940-02-21');
  assert.equal(resolveHistoricalArticle(birthday.slug).slug,birthday.slug);
  const parsed=parseCalendarFeed(feed([
    ['UID:old-copy','DTSTART;VALUE=DATE:20260221','SUMMARY:Anniversary: John Lewis is born near Troy, Alabama','DESCRIPTION:[southview-story:john-lewis]'],
    record(birthday),
    record(article),
    record(article,{id:'duplicate-copy'}),
  ]),2026);
  assert.equal(parsed.events.length,2);
  assert.deepEqual(new Set(parsed.events.map(event=>event.date)),new Set(['2026-02-21','2026-03-07']));
});

test('the newest record wins only for copies of the same occurrence on the same day',()=>{
  const article=historicalArticles[0];
  const parsed=parseCalendarFeed(feed([
    record(article,{id:'older',start:'20260108',modified:'20261026T000000Z'}),
    record(article,{id:'newer',start:'20260108',title:'Newest title',modified:'20261027T000000Z'}),
  ]),2026);
  assert.equal(parsed.events.length,1);
  assert.equal(parsed.events[0].date,'2026-01-08');
  assert.equal(parsed.articles[0].title,'Newest title');
});

test('separate dates for the same article are not silently merged',()=>{
  const article=historicalArticles[0];
  const parsed=parseCalendarFeed(feed([
    record(article,{id:'first-day',start:'20260107'}),
    record(article,{id:'second-day',start:'20260108'}),
  ]),2026);
  assert.equal(parsed.events.length,2);
});

test('different historic years on the same anniversary day remain distinct',()=>{
  const birthday=historicalArticles.find(article=>article.date==='1929-01-15');
  const memorial=historicalArticles.find(article=>article.date==='1969-01-15');
  const parsed=parseCalendarFeed(feed([record(birthday),record(memorial),record(birthday,{id:'birthday-copy'})]),2026);
  assert.equal(parsed.articles.length,2);
  assert.equal(parsed.events.length,2);
  assert.ok(parsed.events.every(event=>event.date==='2026-01-15'));
});

test('separate tour times survive; copied scheduled events appear once',()=>{
  const tour=(id,start,end)=>[`UID:${id}`,'SUMMARY:Walking tour',`DTSTART:${start}`,`DTEND:${end}`];
  const parsed=parseCalendarFeed(feed([
    tour('morning','20261201T150000Z','20261201T153000Z'),
    tour('afternoon','20261201T180000Z','20261201T183000Z'),
    tour('morning-copy','20261201T150000Z','20261201T153000Z'),
    ['UID:all-day','SUMMARY:Family remembrance','DTSTART;VALUE=DATE:20261202'],
  ]),2026);
  assert.equal(parsed.events.length,3);
  assert.match(parsed.events[0].time,/10:00.*10:30.*AM ET/);
  assert.match(parsed.events[1].time,/1:00.*1:30.*PM ET/);
  assert.equal(parsed.events[2].time,undefined);
});

test('an empty Calendar does not bring back the retired local event overlay',()=>{
  assert.deepEqual(calendarEventsForMonth(2026,10,[],[]),[]);
  assert.deepEqual(parseCalendarFeed(feed([]),2026),{events:[],articles:[]});
});

test('former story links and merged burial links all point to one article',()=>{
  for(const [alias,subject] of [
    ['a-nobel-prize-for-nonviolence','martin-luther-king-jr'],
    ['remembering-ruby-doris','remembering-ruby-doris'],
    ['a-cemetery-of-their-own','sterling-watts'],
    ['1904-04-03-harriet-graham-is-buried-at-south-view','harriet-graham'],
    ['1898-11-10-wade-hampton-is-buried-at-south-view-after-his-execution','wade-hampton'],
  ])assert.equal(resolveHistoricalArticle(alias)?.subjectId,subject,alias);
  const entries=timelineEntries(0,9999);
  assert.equal(new Set(entries.map(item=>item.href)).size,entries.length);
});
