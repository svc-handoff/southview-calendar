import { notFound, redirect } from 'next/navigation';
import { historicalArticles, storiesWithProfiles } from '@/lib/events';

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const legacyArticles: Record<string, string> = {
    'a-cemetery-of-their-own': '1885-10-26-sterling-watts-is-buried-in-segregated-rest-haven',
    'a-nobel-prize-for-nonviolence': '1964-10-14-martin-luther-king-jr-is-announced-as-nobel-peace-prize-laureate',
    'remembering-ruby-doris': '1967-10-07-ruby-doris-smith-robinson-dies',
  };
  if (legacyArticles[slug] && historicalArticles.some((article) => article.slug === legacyArticles[slug])) redirect(`/events/${legacyArticles[slug]}`);
  const story = storiesWithProfiles.find((item) => item.slug === slug);
  if (!story) notFound();

  return (
    <main className="person-page">
      <a className="person-back" href="/" aria-label="Back to calendar">←</a>
      <article className="person-card">
        <h1>{story.title}</h1>
        <figure>
          <img src={story.image} alt={story.alt} />
          <figcaption>{story.imageSource && <>Image record: <a href={story.imageSource} target="_blank" rel="noreferrer">view source ↗</a>. </>}{story.credit}</figcaption>
        </figure>
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
