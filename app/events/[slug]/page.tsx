import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { displayHistoricalDate, resolveHistoricalArticle } from '@/lib/events';
import { readCalendarSnapshot } from '@/lib/google-calendar';

export const dynamic = 'force-dynamic';

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const snapshot = await readCalendarSnapshot(new Date().getFullYear());
  const article = resolveHistoricalArticle(slug,snapshot.articles);
  if (!article) notFound();
  if (slug !== article.slug) redirect(`/events/${article.slug}`);

  return (
    <main className="event-page">
      <Link className="person-back" href="/" aria-label="Back to calendar and timeline">←</Link>
      <article className="event-article">
        <p className="event-date">{displayHistoricalDate(article.date)}</p>
        <h1>{article.title}</h1>
        {article.image && <figure>
          <img src={article.image} alt={article.alt} />
          <figcaption>
            {article.imageSource && <>Image record: <a href={article.imageSource} target="_blank" rel="noreferrer">view source ↗</a>. </>}
            {article.imageCredit}
          </figcaption>
        </figure>}
        <div className="event-copy">
          {article.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          {article.dateNote && <aside className="event-note">Date note: {article.dateNote}</aside>}
        </div>
        {article.sources?.length ? <div className="event-source"><strong>Sources</strong><ul>{article.sources.map((source, index) => <li key={`${source.url || source.note}-${index}`}>
          {source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.label || new URL(source.url).hostname} ↗</a> : <>{source.label}: {source.note}</>}
        </li>)}</ul></div> : article.source && <p className="event-source">Source: {article.source?.startsWith('http')
          ? <a href={article.source} target="_blank" rel="noreferrer">{article.sourceLabel || 'View source'} ↗</a>
          : article.source}</p>}
      </article>
    </main>
  );
}
