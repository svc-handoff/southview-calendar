import { notFound, redirect } from 'next/navigation';
import { resolveHistoricalArticle } from '@/lib/events';
import { readCalendarSnapshot } from '@/lib/google-calendar';

export const dynamic = 'force-dynamic';

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const snapshot = await readCalendarSnapshot(new Date().getFullYear());
  const article = resolveHistoricalArticle(slug, snapshot.articles);
  if (!article) notFound();
  redirect(`/events/${article.slug}`);
}
