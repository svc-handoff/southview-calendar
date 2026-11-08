# South-View calendar and timeline

A minimal calendar and historical timeline for South-View Cemetery in Atlanta. The project separates historical events, current events, and person reminders into three Google Calendars.

This branch (`vercel`) contains the current application deployed at https://southview-calendar.vercel.app/. The [`main` branch](https://github.com/anantk2006/southview-calendar/tree/main) preserves the original Sites build.

## Run locally

- Node.js `>=22.13.0`
- Run `npm run install:ci` to install the locked dependencies.
- Run `npm run dev` to start the local development server.
- Run `npm run build` to create a production build.

Google Calendar’s **South-View Past Events** and **Southview Cemetery Current Events** calendars are the source for entries shown on the website. The site combines their public feeds into one month-by-month calendar. Past-event entries belong in the past calendar; tours and other current activities belong in the current calendar. This keeps current entries out of the historical calendar even when an event is all-day.

For an image, put its source URL on the first line of the description. Wikimedia Commons file pages and direct image URLs are supported; the modal shows the supplied image without a caption. Put the article text after a blank line, then add source URLs at the bottom as plain text. The site displays the description as written and makes raw URLs clickable; it does not extract or organize sources. The title in Calendar becomes the event title on the site. The modal opens directly from the calendar; no separate page is needed for a new entry.

Edits to either public event calendar appear on the site after reload and do not need a redeploy. Both event calendars share event details publicly. Existing entries with `[southview-event]` metadata remain supported for legacy dates, images, and merged-story aliases; source links should be written in the description as plain text.

`lib/google-calendar.ts` reads that public feed. The API and article pages use the same parsed records. Deduplication compares the permanent article identity, calendar date and time. Different milestones for the same person remain separate, including historical events from different years that share an anniversary day. The JSON files in `lib/` retain the researched migration source and standalone biographies; they do not add a second set of events to the website.

Remember Someone reads only the private **South-View Remember Someone — Birthdays** calendar on each search. Create an all-day yearly event with the person's name and actual date of birth, including the original birth year. Calendar edits and deletions are reflected on subsequent searches. The CSV is an offline import source only; it is not bundled into the deployment or used as a fallback.

Imported reminders may start in the current year, with the original birthday recorded as `Born: YYYY-MM-DD` in the description. February 29 reminders start in a valid leap year. The search uses that original date when its month and day match the event date. `scripts/verify-birthday-migration.mjs` compares the private calendar against the offline source before the calendar-only release.

The server reads the private feed through `REMEMBER_BIRTHDAY_FEED_URL`, stored as a Vercel Secret and locally in ignored `.env.development.local`. Never expose it through a `NEXT_PUBLIC_` variable or return the feed to a browser. `/api/memorials` returns only matching names and birth dates. Each person card has its own Google Calendar and ICS buttons. The legacy death-anniversary calendar is retained but no longer searched.
