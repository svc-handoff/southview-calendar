// Temporary demo presentation only. Original articles stay in Google Calendar
// and the research/profile source files. Set false to show them again.
export const demoArticleText = true;

const placeholderParagraphs = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
];

export function displayedArticleParagraphs(originalParagraphs: string[]): string[] {
  return demoArticleText ? placeholderParagraphs : originalParagraphs;
}
