import { type ReactNode } from 'react';

function linkedText(text: string): ReactNode[] {
  const result: ReactNode[] = [];
  const tokens = /\[([^\]\n]+)\]\((https?:\/\/(?:[^\s()]|\([^()\s]*\))+)\)|\*([^*\n]+)\*|https?:\/\/[^\s<>]+/g;
  let cursor = 0;
  for (const match of text.matchAll(tokens)) {
    result.push(text.slice(cursor, match.index));
    if (match[1] && match[2]) {
      result.push(<a key={match.index} href={match[2]} target="_blank" rel="noreferrer">{match[1]}</a>);
    } else if (match[3]) {
      result.push(<em key={match.index}>{linkedText(match[3])}</em>);
    } else {
      const raw = match[0];
      let url = raw.replace(/[.,;:!?]*$/, '');
      while (url.endsWith(')') && (url.match(/\)/g)?.length || 0) > (url.match(/\(/g)?.length || 0)) url = url.slice(0, -1);
      result.push(<span key={match.index}><a href={url} target="_blank" rel="noreferrer">{url}</a>{raw.slice(url.length)}</span>);
    }
    cursor = match.index + match[0].length;
  }
  result.push(text.slice(cursor));
  return result;
}

export function ArticleCopy({ paragraphs }: { paragraphs: string[] }) {
  return paragraphs.map((paragraph, index) => {
    // Keep image provenance in the stored description without displaying a footer.
    const lines = paragraph.split('\n');
    const creditIndex = lines.findIndex(line => /^Image (?:credit|source):/i.test(line.trim()));
    const content = (creditIndex < 0 ? lines : lines.slice(0, creditIndex)).join('\n').trim();
    if (!content) return null;
    if (!content.startsWith('Sources:')) return <p key={index}>{linkedText(content)}</p>;
    return <section className="article-sources" aria-label="Sources" key={index}>
      <p><strong>Sources:</strong></p>
      {content.split('\n').slice(1).map((source, sourceIndex) => <p key={sourceIndex}>{linkedText(source)}</p>)}
    </section>;
  });
}
