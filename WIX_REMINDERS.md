# Wix version of the South-View reminder lookup

The local demo searches a minimized, git-ignored copy of `SouthViewData.csv` on the server and produces a downloadable `.ics` file. The CSV itself must never be attached to page code, a repeater, or a public static asset.

## Wix setup

1. Enable Velo and create a CMS collection such as `MemorialDates` with `normalizedName`, `displayName`, `birthDate`, and `deathDate` fields. Import only records the cemetery has approved for this purpose. Keep collection read, update, and delete permissions restricted to administrators; write access should also stay with administrators.
2. Add a backend web method in `backend/memorials.web.js`. Give it `Permissions.SiteMember`, validate and normalize the submitted name, query the private collection in the backend, filter out records without a valid death date, deduplicate exact records, and return only matching names and validated birth dates. Treat a one-word query as a last-name search, accepting a close spelling or prefix and ranking by similarity; treat a multi-word query as a fuzzy full-name search. Keep exact matches first and do not return the collection itself.
3. On the page, use Wix Members for account sign-up/sign-in, then call the backend method after the visitor enters a surname or full name. Display each match as a selectable person card showing their birth date; selecting the card adds or removes that person. Include an Add all action for matching records with birth dates.
4. Generate one `.ics` file in the page code from the selected birth dates only. This keeps the visitor’s selection private and does not require storing their search or calendar choice. The visitor imports the downloaded file and confirms the import in their calendar app.
5. If the cemetery wants to save searches or send calendar-feed links, collect only the minimum information needed and add a clear purpose/retention notice. A live personalized feed needs a Wix backend endpoint and an unguessable per-subscriber URL; it is a separate feature from a one-time `.ics` download.

Wix documents backend web methods and their `Anyone`, `Admin`, and `SiteMember` permissions in [Web Modules](https://dev.wix.com/docs/velo/apis/wix-web-module/web-method). Its [collection security guidance](https://dev.wix.com/docs/develop-websites/articles/best-practices/security-best-practices) warns that backend methods that bypass collection permissions must validate requests and filter sensitive data before returning results. Wix also supports visitor forms and CMS collections; use [custom form collection permissions](https://support.wix.com/en/article/creating-a-form-with-user-input-elements) only for actual submissions, not as a public read path to memorial records.

## Before publishing the dataset

The CSV contains 11,742 rows, repeated names, missing and malformed dates, and one future death date. It has no unique record ID or grave-location field. The local importer excludes entries without a valid past death date and deduplicates identical rows, but this does not establish that the remaining names and dates are cleared for public display. Confirm the cemetery’s permission and intended audience before importing any data into a live Wix site. A member-only endpoint still needs abuse controls because repeated name searches could reveal records.
