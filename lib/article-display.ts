// Human-edited articles are now live in Google Calendar.
export const demoArticleText = false;

const placeholderParagraphs = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
];

export function displayedArticleParagraphs(originalParagraphs: string[]): string[] {
  return articleParagraphs((demoArticleText ? placeholderParagraphs : originalParagraphs).join('\n\n'));
}

export function articleSourceLines(text: string): string[] {
  return text.replace(/\r\n?/g, '\n')
    // Documents sometimes wrap a URL at a hyphen or slash. Rejoin that
    // continuation before separating entries so it remains one working link.
    .replace(/(https?:\/\/\S*[-/])[^\S\n]*\n[^\S\n]*(?!https?:\/\/)(?=[a-z0-9])/g, '$1')
    .replace(/(https?:\/\/\S+)[^\S\n]+,(?=[\s]|$)/g, '$1,')
    .split(/\n+/)
    .flatMap(line => {
      const trimmed = line.trim();
      // Split standalone URL lists, while keeping author names, dates,
      // titles and page numbers together inside written citations.
      return /^https?:\/\//i.test(trimmed)
        ? trimmed.replace(/(https?:\/\/\S+?),[ \t]+(?=\S)|,(?=https?:\/\/)/gi, (_match, url: string | undefined) => `${url || ''}\n`).split('\n')
        : [trimmed];
    })
    .map(line => line.replace(/\s+/gu, ' ').trim().replace(/^(https?:\/\/\S+),$/i, '$1'))
    .filter(Boolean);
}

// Calendar descriptions often contain line wraps copied from a document.
// Only blank lines start paragraphs; single newlines, tabs, and repeated
// spaces are display whitespace, except in the writer's Sources section.
// Keep this at the display boundary so the writer's source stays untouched.
export function articleParagraphs(text: string): string[] {
  const normalized = text.replace(/\r\n?/g, '\n');
  const heading = /(?:^|\n)[^\S\n]*Sources?\s*:[^\S\n]*/i.exec(normalized);
  const body = heading ? normalized.slice(0, heading.index) : normalized;
  const paragraphs = body
    .split(/\n[^\S\n]*\n/)
    .map(paragraph => paragraph.replace(/\s+/gu, ' ').trim())
    .filter(Boolean);
  if (heading) {
    const sources = articleSourceLines(normalized.slice(heading.index + heading[0].length));
    paragraphs.push(['Sources:', ...sources].join('\n'));
  }
  return paragraphs;
}
