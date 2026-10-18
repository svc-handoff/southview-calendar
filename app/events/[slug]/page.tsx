import { notFound } from 'next/navigation';
import { displayHistoricalDate, historicalArticles } from '@/lib/events';

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = historicalArticles.find((item) => item.slug === slug);
  if (!article) notFound();

  return (
    <main className="event-page">
      <a className="person-back" href="/" aria-label="Back to calendar and timeline">←</a>
      <article className="event-article">
        <p className="event-date">{displayHistoricalDate(article.date)}</p>
        <h1>{article.title}</h1>
        <figure>
          <img src={article.image} alt={article.alt} />
          <figcaption><a href={article.imageSource} target="_blank" rel="noreferrer">{article.imageCredit}</a></figcaption>
        </figure>
        <div className="event-copy">
          {article.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          {article.dateNote && <aside className="event-note">Date note: {article.dateNote}</aside>}
        </div>
        <p className="event-source">Source: {article.source?.startsWith('http')
          ? <a href={article.source} target="_blank" rel="noreferrer">{article.sourceLabel || 'View source'} ↗</a>
          : article.source || 'South-View: City of the Dead'}</p>
      </article>
    </main>
  );
}
