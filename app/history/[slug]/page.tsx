import { notFound, redirect } from 'next/navigation';
import { resolveHistoricalArticle } from '@/lib/events';
import { readCalendarSnapshot } from '@/lib/google-calendar';
import {PublicSiteGuard} from '@/components/public-site-guard';
import {publicSiteHidden} from '@/lib/site-visibility';

export const dynamic = 'force-dynamic';

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  if(await publicSiteHidden())return <PublicSiteGuard initialHidden={true}/>;
  const { slug } = await params;
  const snapshot = await readCalendarSnapshot(new Date().getFullYear());
  const article = resolveHistoricalArticle(slug, snapshot.articles);
  if (!article) notFound();
  redirect(`/events/${article.slug}`);
}
