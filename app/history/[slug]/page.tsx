import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { resolveHistoricalArticle, storiesWithProfiles } from '@/lib/events';
import { readCalendarSnapshot } from '@/lib/google-calendar';

export const dynamic = 'force-dynamic';

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const snapshot = await readCalendarSnapshot(new Date().getFullYear());
  const canonicalArticle = resolveHistoricalArticle(slug,snapshot.articles);
  if (canonicalArticle) redirect(`/events/${canonicalArticle.slug}`);
  if (resolveHistoricalArticle(slug)) notFound();
  const story = storiesWithProfiles.find((item) => item.slug === slug);
  if (!story) notFound();

  return (
    <main className="person-page">
      <Link className="person-back" href="/" aria-label="Back to calendar">←</Link>
      <article className="person-card">
        <h1>{story.title}</h1>
        {story.image ? <figure>
          <img src={story.image} alt={story.alt} />
          <figcaption>{story.imageSource && <>Image record: <a href={story.imageSource} target="_blank" rel="noreferrer">view source ↗</a>. </>}{story.credit}</figcaption>
        </figure> : null}
        <div className="person-placeholder">
          {story.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
        {story.sources?.length ? <div className="event-source"><strong>Sources</strong><ul>{story.sources.map((source, index) => <li key={`${source.url || source.note}-${index}`}>
          {source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.label || new URL(source.url).hostname} ↗</a> : <>{source.label}: {source.note}</>}
        </li>)}</ul></div> : null}
      </article>
    </main>
  );
}
