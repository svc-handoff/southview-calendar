# South-View calendar and timeline

A minimal calendar and historical timeline for South-View Cemetery in Atlanta. The project includes historical event articles, short biographies, image credits, and a Google Calendar feed for the demo walking tour.

## Run locally

- Node.js `>=22.13.0`
- Run `npm run install:ci` to install the locked dependencies.
- Run `npm run dev` to start the local development server.
- Run `npm run build` to create a production build.

Google Calendar’s **South-View History — Demo** calendar is the source for website entries and article content. To add or edit an entry, edit its Google Calendar title, date, and description. For historical anniversaries, make the event all-day, choose **Does not repeat → Annually**, and leave the location blank. If an entry has a time or location, the site treats it as a current event; otherwise it treats it as historical.

For an image, put its source URL on the first line of the description. Wikimedia Commons file pages and direct image URLs are supported; the modal shows the image and links to that source. Put the article text after a blank line. Keep source links inline in the paragraph (for example, `According to the [SNCC Digital Gateway](https://snccdigital.org/people/julian-bond/), ...`). The title in Calendar becomes the event title on the site. The modal opens directly from the calendar; no separate page is needed for a new entry.

Edits to Calendar appear on the site after reload and do not need a redeploy. The calendar must share all event details publicly. Existing entries with `[southview-event]` metadata remain supported, so their legacy dates, image credits, citations, and merged-story aliases continue working.

`lib/google-calendar.ts` reads that public feed. The API and article pages use the same parsed records. Deduplication compares the permanent article identity, calendar date and time. Different milestones for the same person remain separate, including historical events from different years that share an anniversary day. The JSON files in `lib/` retain the researched migration source and standalone biographies; they do not add a second set of events to the website.

The historical collection has 54 entries from the original 56. Only Harriet Graham’s nearby death/burial notices and Wade Hampton’s execution/burial notices are combined. Birthdays, later achievements, deaths, memorials and founding milestones on separate dates retain their own entries. The tour and other independently created Calendar entries are retained. Original Google Calendar snapshots from the migration are saved outside the source checkout in the task’s `work/` directory.

## Project structure

- `app/page.tsx` renders the scrollable calendar and reminder search.
- `app/events/[slug]/page.tsx` keeps legacy article links working; calendar entries open in a modal.
- `app/history/[slug]/page.tsx` renders people pages.
- `public/images/` contains local images used by the site.

This project uses Vinext and can be published with the Sites workflow configured for this checkout.
