# Southview Vercel deployment

Production: https://southview-calendar.vercel.app

Vercel workspace: anantk2006s-projects (Hobby)
Project: southview-calendar

This version was prepared from Sites source commit 70fd91c3bca33fad9f5ce3c2ce29de6a82eb8147. It uses standard Next.js and is maintained on the `vercel` branch of https://github.com/anantk2006/southview-calendar. The `main` branch preserves the original Sites build.

Google Calendar data remains live through the public event feeds and private birthday feed. Calendar content edits do not need redeployment. Code is stored in GitHub; Vercel deployments remain manual.

To publish code updates from this copy:

    npx --yes vercel@65.9.0 project inspect southview-calendar --scope anantk2006s-projects --non-interactive
    npx --yes vercel@65.9.0 deploy --prod --scope anantk2006s-projects --non-interactive


Remember Someone now reads a private birthday calendar using the server-only `REMEMBER_BIRTHDAY_FEED_URL` Vercel Secret. Its value must not be included in source, client bundles, deployment logs, or public assets. Local development uses the ignored `.env.development.local` file. Birthday source imports are generated from validated deceased records with known birth dates; the old death calendar remains intact.

The birthday calendar is the sole search source. CSV imports and local birthday JSON files are excluded from deployments; no local fallback can bring back removed Calendar records. The private feed is fetched server-side on each search and only matching names and birth dates are returned.
