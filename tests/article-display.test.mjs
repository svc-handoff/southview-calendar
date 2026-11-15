import assert from 'node:assert/strict';
import test from 'node:test';
import { articleParagraphs, displayedArticleParagraphs } from '../lib/article-display.ts';

test('document line wraps flow naturally while real paragraphs stay separate', () => {
  const text = 'He also campaigned\nfor\nBlack education.\n\nOn November 17, 1927, a monument was\nerected at\nSouth-View.';
  assert.deepEqual(articleParagraphs(text), [
    'He also campaigned for Black education.',
    'On November 17, 1927, a monument was erected at South-View.',
  ]);
});

test('pasted spaces, tabs, nonbreaking spaces, and Windows line endings do not create gaps', () => {
  assert.deepEqual(articleParagraphs('  Born\u00a0\u00a0in\t1842,  Holsey\r\nhelped.\r\n \t\r\n\r\nSources: https://example.com/a  '), [
    'Born in 1842, Holsey helped.', 'Sources:\nhttps://example.com/a',
  ]);
});

test('source lists display one entry per line without changing the article or citation punctuation', () => {
  const book = 'South-View: An African American City of the Dead by D.L. Henderson';
  assert.deepEqual(articleParagraphs(`Born in 1842, he\nhelped build a school.\n\nSources: https://example.com/a, https://example.com/b, ${book}`), [
    'Born in 1842, he helped build a school.', `Sources:\nhttps://example.com/a\nhttps://example.com/b\n${book}`,
  ]);
  assert.deepEqual(articleParagraphs('Article.\nSources:\nHenderson, page 24\nhttps://example.com/a?q=one,two,\nhttps://example.com/b\n\nWilliams, Kerrie. "Article." Encyclopedia, 19 May 2010, https://example.com/c.'), [
    'Article.', 'Sources:\nHenderson, page 24\nhttps://example.com/a?q=one,two\nhttps://example.com/b\nWilliams, Kerrie. "Article." Encyclopedia, 19 May 2010, https://example.com/c.',
  ]);
  assert.deepEqual(displayedArticleParagraphs(['Article.', 'Sources:', 'https://example.com/a,https://example.com/b']), [
    'Article.', 'Sources:\nhttps://example.com/a\nhttps://example.com/b',
  ]);
});

test('legacy article pages use the same formatting without mutating source text', () => {
  const original = ['The writer’s  exact\nwords & punctuation.', 'Another paragraph.'];
  const copy = [...original];
  assert.deepEqual(displayedArticleParagraphs(original), ['The writer’s exact words & punctuation.', 'Another paragraph.']);
  assert.deepEqual(original, copy);
  assert.deepEqual(articleParagraphs(' \n\n\t'), []);
});
