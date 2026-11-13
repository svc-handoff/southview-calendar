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

Remember Someone reads only names and birth dates added through the private `/admin` upload page. It does not read the former birthday or death-anniversary Google Calendars. Those calendars and the offline migration scripts are retained as archives, not search sources. `/api/memorials` returns only matching uploaded records; each person card retains its Google Calendar and ICS export buttons.

## Private staff imports

Staff use `/admin` directly to sign in and upload `.xlsx` or `.csv` files. No public sign-up or write endpoint is available without the staff session. Each file can contain up to 10,000 people and be up to 4 MB. The Excel template uses DateOfBirth, DateOfDeath, FirstName, LastName, MiddleName, with MM/DD/YYYY date formatting. DateOfDeath is accepted but birthday reminders use only DateOfBirth. Common alternate name and birth-date headings are also detected. A preview shows dates, duplicates, and invalid rows before import. The upload screen has no recent-upload history.

Imported names and birth dates are stored in a **private Vercel Blob store**, separate from the public source repository. Original spreadsheets and unrelated columns are not stored. Remember Someone searches only staff-uploaded records; it does not read the old birthday Google Calendar. Imported people are deduplicated by normalized full name and full birth date. Staff imports do not create thousands of Google Calendar events. Public visitors can search for matching people and export individual annual birthday reminders.

Server-only configuration: `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (`hex salt:hex scrypt hash`, Node scrypt defaults, 64-byte key), `ADMIN_SESSION_SECRET` (at least 32 random characters), plus the connected private store's `BLOB_READ_WRITE_TOKEN` or OIDC `BLOB_STORE_ID`. Configure secrets in Vercel; never commit them. Staff sessions last eight hours. Login attempts are rate-limited in persistent private storage. Admin routes enforce same-origin writes, have no public caching, and cannot be framed. The public `/` page retains its Wix iframe compatibility; link staff directly to `/admin` rather than embedding it.
