# South-View calendar and timeline

A minimal calendar and historical timeline for South-View Cemetery in Atlanta. The project separates historical events, current events, and person reminders into three Google Calendars.

This branch (`main`) preserves the original Sites build. The [`vercel` branch](https://github.com/anantk2006/southview-calendar/tree/vercel) contains the current application deployed at https://southview-calendar.vercel.app/, including the calendar-only birthday search.

## Run locally

- Node.js `>=22.13.0`
- Run `npm run install:ci` to install the locked dependencies.
- Run `npm run dev` to start the local development server.
- Run `npm run build` to create a production build.

Google Calendar’s **South-View Past Events** and **Southview Cemetery Current Events** calendars are the source for entries shown on the website. The site combines their public feeds into one month-by-month calendar. Past-event entries belong in the past calendar; tours and other current activities belong in the current calendar. This keeps current entries out of the historical calendar even when an event is all-day.

For an image, put its source URL on the first line of the description. Wikimedia Commons file pages and direct image URLs are supported; the modal shows the supplied image without a caption. Put the article text after a blank line, then add source URLs at the bottom as plain text. The site displays the description as written and makes raw URLs clickable; it does not extract or organize sources. The title in Calendar becomes the event title on the site. The modal opens directly from the calendar; no separate page is needed for a new entry.

Edits to either public event calendar appear on the site after reload and do not need a redeploy. Both event calendars share event details publicly. Existing entries with `[southview-event]` metadata remain supported for legacy dates, images, and merged-story aliases; source links should be written in the description as plain text.

`lib/google-calendar.ts` reads that public feed. The API and article pages use the same parsed records. Deduplication compares the permanent article identity, calendar date and time. Different milestones for the same person remain separate, including historical events from different years that share an anniversary day. The JSON files in `lib/` retain the researched migration source and standalone biographies; they do not add a second set of events to the website.

The **South-View Remember Someone** calendar separately powers name search and reminder export. It contains one all-day yearly event per cemetery record, titled with the person's name and dated on the death anniversary; descriptions stay blank. Its public iCal feed is polled by `/api/memorials` when a visitor searches. This calendar is not displayed in the month view. Visitors can add selected yearly reminders to Google Calendar or download an `.ics` file.

The historical collection uses the human-edited articles from the editing sheet. Rows marked Remove have been retired, including the standalone profile pages. The article wording is copied exactly into Calendar; sources from the sheet remain plain text at the bottom. The tour and other independently created Calendar entries are retained. Original Google Calendar snapshots from the migration are saved outside the source checkout in the task’s `work/` directory.

## Project structure

- `app/page.tsx` renders the scrollable calendar and reminder search.
- `app/events/[slug]/page.tsx` keeps legacy article links working; calendar entries open in a modal.
- `app/history/[slug]/page.tsx` redirects retained legacy links; removed profiles return 404.
- `public/images/` contains local images used by the site.

This project uses Vinext and can be published with the Sites workflow configured for this checkout.
