# South-View calendar and timeline

A minimal calendar and historical timeline for South-View Cemetery in Atlanta. The project includes historical event articles, short biographies, image credits, and a Google Calendar feed for the demo walking tour.

## Run locally

- Node.js `>=22.13.0`
- Run `npm run install:ci` to install the locked dependencies.
- Run `npm run dev` to start the local development server.
- Run `npm run build` to create a production build.

Historical events and article copy live in `lib/research-data.json` and `lib/researched-content.json`. Update both when adding or revising an event: the first file drives calendar and timeline entries, while the second supplies article paragraphs, citations, and image credits. Keep citation links and uncertainty notes close to the claims they support.

The demo tour calendar is read from the public iCalendar feed in `app/api/calendar/route.ts`. The tour is fictional and labeled as a demo in the interface.

## Project structure

- `app/page.tsx` renders the scrollable calendar and horizontal timeline.
- `app/events/[slug]/page.tsx` renders event articles.
- `app/history/[slug]/page.tsx` renders people pages.
- `public/images/` contains local images used by the site.

This project uses Vinext and can be published with the Sites workflow configured for this checkout.
