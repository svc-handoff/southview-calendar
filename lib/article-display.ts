// Human-edited articles are now live in Google Calendar.
export const demoArticleText = false;

const placeholderParagraphs = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
];

export function displayedArticleParagraphs(originalParagraphs: string[]): string[] {
  return (demoArticleText ? placeholderParagraphs : originalParagraphs)
    .flatMap(articleParagraphs);
}

// Calendar descriptions often contain line wraps copied from a document.
// Only blank lines start paragraphs; single newlines, tabs, and repeated
// spaces are display whitespace, not instructions to break the article.
// Keep this at the display boundary so the writer's source stays untouched.
export function articleParagraphs(text: string): string[] {
  return text.replace(/\r\n?/g, '\n')
    .split(/\n[^\S\n]*\n/)
    .map(paragraph => paragraph.replace(/\s+/gu, ' ').trim())
    .filter(Boolean);
}
