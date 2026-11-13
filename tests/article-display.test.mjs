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
    'Born in 1842, Holsey helped.', 'Sources: https://example.com/a',
  ]);
});

test('legacy article pages use the same formatting without mutating source text', () => {
  const original = ['The writer’s  exact\nwords & punctuation.', 'Another paragraph.'];
  const copy = [...original];
  assert.deepEqual(displayedArticleParagraphs(original), ['The writer’s exact words & punctuation.', 'Another paragraph.']);
  assert.deepEqual(original, copy);
  assert.deepEqual(articleParagraphs(' \n\n\t'), []);
});
