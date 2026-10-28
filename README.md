# South-View calendar and timeline

A minimal calendar and historical timeline for South-View Cemetery in Atlanta. The project includes historical event articles, short biographies, image credits, and a Google Calendar feed for the demo walking tour.

## Run locally

- Node.js `>=22.13.0`
- Run `npm run install:ci` to install the locked dependencies.
- Run `npm run dev` to start the local development server.
- Run `npm run build` to create a production build.

Google Calendar’s **South-View History — Demo** calendar is the source for the website’s event entries and historical articles. The 33 consolidated historical entries repeat annually; the original historical dates, sources, image links and credits are stored in their descriptions.

To edit an article, edit the event’s title and the opening paragraphs in its Google Calendar description. Keep the bracketed `[southview-event]` details intact: they hold the historical date, permanent article address, aliases for merged stories, citations and image credits. Date and time changes in Calendar drive the website’s calendar directly. Reload the website to fetch changes; article edits do not need a redeploy. The calendar must share all event details publicly.

`lib/google-calendar.ts` reads that public feed. The API and article pages use the same parsed records and deduplicate by subject, permanent article identity and former article addresses. The JSON files in `lib/` retain the researched migration source and standalone biographies; they do not add a second set of events to the website.

The historical collection was consolidated from 56 to 33 entries. Birth, death, burial and memorial notices for the same person are folded into the featured article. The tour and other independently created Calendar entries are retained. Original Google Calendar snapshots from the migration are saved outside the source checkout in the task’s `work/` directory.

## Project structure

- `app/page.tsx` renders the scrollable calendar and reminder search.
- `app/events/[slug]/page.tsx` renders event articles.
- `app/history/[slug]/page.tsx` renders people pages.
- `public/images/` contains local images used by the site.

This project uses Vinext and can be published with the Sites workflow configured for this checkout.
