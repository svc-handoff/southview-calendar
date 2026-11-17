import { Fragment, type ReactNode } from 'react';

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

function imageCredit(lines: string[], key: number) {
  return <p className="article-image-credit" key={key}><small>{lines.map((line, index) =>
    <Fragment key={index}>{index > 0 && <br />}{linkedText(line)}</Fragment>
  )}</small></p>;
}

export function ArticleCopy({ paragraphs }: { paragraphs: string[] }) {
  return paragraphs.map((paragraph, index) => {
    if (paragraph.startsWith('Image credit:')) return imageCredit(paragraph.split('\n'), index);
    if (!paragraph.startsWith('Sources:')) return <p key={index}>{linkedText(paragraph)}</p>;
    const lines = paragraph.split('\n').slice(1);
    const creditIndex = lines.findIndex(line => line.startsWith('Image credit:'));
    const sources = creditIndex < 0 ? lines : lines.slice(0, creditIndex);
    const credit = creditIndex < 0 ? [] : lines.slice(creditIndex);
    return <Fragment key={index}>
      <section className="article-sources" aria-label="Sources">
        <p><strong>Sources:</strong></p>
        {sources.map((source, sourceIndex) => <p key={sourceIndex}>{linkedText(source)}</p>)}
      </section>
      {credit.length > 0 && imageCredit(credit, index)}
    </Fragment>;
  });
}
