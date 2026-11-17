import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import { articleParagraphs, displayedArticleParagraphs } from '../lib/article-display.ts';
import sourceFixtures from './fixtures/live-article-sources.json' with {type:'json'};

const componentSource=readFileSync(new URL('../components/article-copy.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(componentSource,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
  .replaceAll('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime')))
  .replaceAll("'react'",JSON.stringify(import.meta.resolve('react')));
const {ArticleCopy}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const plainHtml=html=>html.replace(/<[^>]*>/g,'').replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#x27;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>');

test('short citation labels remain clickable without image-credit footers',()=>{
  const paragraphs=articleParagraphs('An article ([Williams](https://example.com/article)).\n\nSources:\nA source — https://example.com/article\n\nImage credit: Creator\nImage source: https://example.com/photo');
  const html=renderToStaticMarkup(createElement(ArticleCopy,{paragraphs}));
  assert.ok(html.includes('href="https://example.com/article" target="_blank" rel="noreferrer">Williams</a>'));
  const sourceSection=html.match(/<section class="article-sources"[^>]*>([\s\S]*?)<\/section>/)[1];
  assert.ok(!sourceSection.includes('Image credit:'));
  assert.ok(!html.includes('Image credit:'));
  assert.ok(!html.includes('Image source:'));
  assert.ok(!html.includes('https://example.com/photo'));
  const joinedFooter=renderToStaticMarkup(createElement(ArticleCopy,{paragraphs:[
    'Article text.', 'Sources:\nA source — https://example.com/article\nImage credit: Creator\nImage source: https://example.com/photo',
  ]}));
  assert.ok(joinedFooter.includes('Article text.'));
  assert.ok(joinedFooter.includes('A source'));
  assert.ok(!joinedFooter.includes('Image credit:'));
  assert.ok(!joinedFooter.includes('Image source:'));
});

for(const fixture of sourceFixtures) {
  test(`source formatting and rendered rows: ${fixture.title}`,()=>{
    const paragraphs=articleParagraphs('Article text stays unchanged.\n\n'+fixture.input);
    assert.deepEqual(paragraphs,['Article text stays unchanged.',['Sources:',...fixture.expected].join('\n')]);
    const html=renderToStaticMarkup(createElement(ArticleCopy,{paragraphs}));
    const sourceSection=html.match(/<section class="article-sources"[^>]*>([\s\S]*?)<\/section>/)?.[1];
    assert.ok(sourceSection,'a separate Sources section is rendered');
    const rows=[...sourceSection.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m=>plainHtml(m[1]));
    assert.deepEqual(rows,['Sources:',...fixture.expected],'every source has its own block with exact citation punctuation');
    assert.deepEqual(displayedArticleParagraphs(['Article text stays unchanged.',fixture.input]),paragraphs,'modals and legacy article pages match');
    for(const source of fixture.expected.filter(s=>s.startsWith('https://'))) {
      const url=source.replace(/[.,;:!?)]*$/,'');
      const href=renderToStaticMarkup(createElement('a',{href:url})).match(/href="([^"]*)"/)[1];
      assert.ok(sourceSection.includes(`href="${href}"`),'complete source URL is clickable');
    }
  });
}

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
