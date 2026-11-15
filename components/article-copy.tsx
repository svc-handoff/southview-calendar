import type { ReactNode } from 'react';

function linkedText(text: string): ReactNode[] {
  const result: ReactNode[] = [];
  const links = /https?:\/\/[^\s<>]+/g;
  let cursor = 0;
  for (const match of text.matchAll(links)) {
    result.push(text.slice(cursor, match.index));
    const raw = match[0], url = raw.replace(/[.,;:!?)]*$/, '');
    result.push(<span key={match.index}><a href={url} target="_blank" rel="noreferrer">{url}</a>{raw.slice(url.length)}</span>);
    cursor = match.index + raw.length;
  }
  result.push(text.slice(cursor));
  return result;
}

export function ArticleCopy({ paragraphs }: { paragraphs: string[] }) {
  return paragraphs.map((paragraph, index) => {
    if (!paragraph.startsWith('Sources:')) return <p key={index}>{linkedText(paragraph)}</p>;
    const sources = paragraph.split('\n').slice(1);
    return <section className="article-sources" aria-label="Sources" key={index}>
      <p>Sources:</p>
      {sources.map((source, sourceIndex) => <p key={sourceIndex}>{linkedText(source)}</p>)}
    </section>;
  });
}
