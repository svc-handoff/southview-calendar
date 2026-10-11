import { notFound } from 'next/navigation';
import { stories } from '@/lib/events';

const placeholder = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum.';

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = stories.find((item) => item.slug === slug);
  if (!story) notFound();

  return (
    <main className="person-page">
      <a className="person-back" href="/" aria-label="Back to calendar">←</a>
      <article className="person-card">
        <h1>{story.title}</h1>
        <figure>
          <img src={story.image} alt={story.alt} />
          <figcaption><a href={story.imageSource} target="_blank" rel="noreferrer">{story.credit}</a></figcaption>
        </figure>
        <div className="person-placeholder">
          <p>{placeholder}</p>
          <p>{placeholder}</p>
        </div>
      </article>
    </main>
  );
}
