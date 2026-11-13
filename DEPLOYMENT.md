# Southview Vercel deployment

Production: https://southview-calendar.vercel.app

Vercel workspace: svc-handoff (Hobby)
Project: southview-calendar

This version was prepared from Sites source commit 70fd91c3bca33fad9f5ce3c2ce29de6a82eb8147. It uses standard Next.js and is maintained on the `vercel` branch of https://github.com/svc-handoff/southview-calendar. The `main` branch preserves the original Sites build.

The main calendar remains live through the public past/current Google Calendar feeds. Remember Someone reads only staff-uploaded records in private Vercel Blob storage. Calendar content edits do not need redeployment. Code is stored in GitHub; Vercel deployments remain manual.

To publish code updates from this copy:

    npx --yes vercel@65.9.0 project inspect southview-calendar --scope svc-handoff --non-interactive
    npx --yes vercel@65.9.0 deploy --prod --scope svc-handoff --non-interactive


Remember Someone searches only records uploaded at `/admin`, stored in the private Blob store. Both upload duplicate checks and public name searches use that same directory. The former birthday Calendar feed is no longer read, and `REMEMBER_BIRTHDAY_FEED_URL` is not required. Staff sign-in uses the server-only admin secrets documented in `.env.example`. Never expose storage or admin credentials to client bundles or source control.
