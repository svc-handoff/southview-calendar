// Public OAuth client ID; browser authorization does not use a client secret.
export const GOOGLE_CALENDAR_CLIENT_ID = '128027503363-k1e7iunkv7gfqpnlitpqov4db4c26d9o.apps.googleusercontent.com';
export const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.app.created';

export type BirthdayReminder = { id: string; title: string; date: string };
export type CalendarExportProgress = { added: number; existing: number; total: number };
export type CalendarExportResult = CalendarExportProgress & { calendarUrl: string };
type TokenResponse = { access_token?: string; scope?: string; error?: string };
type GoogleOAuth = {
  initTokenClient(config: {
    client_id: string; scope: string; include_granted_scopes: boolean;
    callback: (response: TokenResponse) => void;
    error_callback: (error: { type: string }) => void;
  }): { requestAccessToken(options: { prompt: string }): void };
};

const API = 'https://www.googleapis.com/calendar/v3';
const CALENDAR_IDS_KEY = 'southview-google-reminder-calendar-ids-v1';
let scriptReady: Promise<void> | undefined;
let rememberedCalendarIds: string[] = [];

function oauthLibrary() {
  return (window as unknown as { google?: { accounts?: { oauth2?: GoogleOAuth } } }).google?.accounts?.oauth2;
}

export function loadGoogleCalendar(): Promise<void> {
  if (oauthLibrary()) return Promise.resolve();
  if (scriptReady) return scriptReady;
  scriptReady = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = setTimeout(() => fail(), 15000);
    function fail() {
      clearTimeout(timeout);
      script.remove();
      scriptReady = undefined;
      reject(new Error('Google sign-in could not load. Reload to try again, or download the calendar file.'));
    }
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      clearTimeout(timeout);
      if (oauthLibrary()) resolve(); else fail();
    };
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return scriptReady;
}

// Called directly from a click after the library loads, so Google's popup
// retains the browser's user gesture. Tokens stay in this operation's memory.
export function authorizeGoogleCalendar(): Promise<string> {
  return new Promise((resolve, reject) => {
    const oauth = oauthLibrary();
    if (!oauth) { reject(new Error('Google sign-in is still loading. Please try again.')); return; }
    const client = oauth.initTokenClient({
      client_id: GOOGLE_CALENDAR_CLIENT_ID,
      scope: GOOGLE_CALENDAR_SCOPE,
      include_granted_scopes: false,
      callback: (response) => {
        if (response.error || !response.access_token || !response.scope?.split(' ').includes(GOOGLE_CALENDAR_SCOPE)) {
          reject(new Error('Calendar permission was not granted. Try again or download the calendar file.'));
        } else resolve(response.access_token);
      },
      error_callback: ({ type }) => reject(new Error(type === 'popup_closed'
        ? 'Google sign-in was closed. Nothing was added.'
        : 'Google sign-in could not open. Allow popups for this site and try again.')),
    });
    client.requestAccessToken({ prompt: 'select_account' });
  });
}

function nextBirthday(dateOfBirth: string, now: Date) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const [, month, day] = dateOfBirth.split('-').map(Number);
  for (let year = Number(today.slice(0, 4)); year <= Number(today.slice(0, 4)) + 8; year++) {
    const date = new Date(Date.UTC(year, month - 1, day));
    const iso = date.toISOString().slice(0, 10);
    if (date.getUTCMonth() === month - 1 && date.getUTCDate() === day && iso >= today) return iso;
  }
  throw new Error('A selected birthday has an invalid date. Please review the selection.');
}

export async function googleBirthdayEvent(reminder: BirthdayReminder, now = new Date()) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`southview-birthday:${reminder.id}`));
  const id = 'svb' + Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  const start = nextBirthday(reminder.date, now);
  const nextDay = new Date(`${start}T00:00:00Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  return {
    id,
    summary: reminder.title,
    description: `Birth date anniversary from South-View cemetery records. Birth date: ${reminder.date}. Check family records for date accuracy.`,
    start: { date: start },
    end: { date: nextDay.toISOString().slice(0, 10) },
    recurrence: ['RRULE:FREQ=YEARLY'],
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 1440 }] },
    transparency: 'transparent',
    visibility: 'private',
  };
}

async function googleRequest(token: string, path: string, init: RequestInit = {}) {
  return fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
    signal: AbortSignal.timeout(20000),
  });
}

function responseError(response: Response) {
  if (response.status === 401) return new Error('Google sign-in expired. Sign in again to continue.');
  if (response.status === 403) return new Error('Google did not allow Calendar access. Check that you used an approved test account and granted Calendar permission.');
  if (response.status === 429) return new Error('Google is limiting requests. Wait a moment and try again.');
  return new Error('Google Calendar could not finish this request. Please try again.');
}

async function reminderCalendar(token: string) {
  // Store only calendar IDs, never access tokens or the visitor's selection.
  // Check ownership with the current token so switching Google accounts cannot
  // accidentally add birthdays to another account's calendar.
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(CALENDAR_IDS_KEY) || '[]');
    if (Array.isArray(stored)) rememberedCalendarIds = stored.filter((id): id is string => typeof id === 'string').slice(0, 20);
  } catch { /* Calendar IDs can still be reused in memory if storage is unavailable. */ }
  for (const id of rememberedCalendarIds) {
    const response = await googleRequest(token, `/users/me/calendarList/${encodeURIComponent(id)}`);
    if ([403, 404, 410].includes(response.status)) continue;
    if (!response.ok) throw responseError(response);
    const calendar = await response.json() as { accessRole?: string };
    if (calendar.accessRole === 'owner') return id;
  }
  const response = await googleRequest(token, '/calendars', { method: 'POST', body: JSON.stringify({
    summary: 'South-View birthdays',
    description: 'Birthday reminders selected from South-View cemetery records.',
    timeZone: 'America/New_York',
  }) });
  if (!response.ok) throw responseError(response);
  const calendar = await response.json() as { id?: string };
  if (!calendar.id) throw new Error('Google did not return a calendar. Please try again.');
  rememberedCalendarIds = [calendar.id, ...rememberedCalendarIds].slice(0, 20);
  try { localStorage.setItem(CALENDAR_IDS_KEY, JSON.stringify(rememberedCalendarIds)); } catch { /* Browser storage is optional. */ }
  return calendar.id;
}

export async function addGoogleBirthdays(token: string, reminders: BirthdayReminder[], onProgress: (progress: CalendarExportProgress) => void): Promise<CalendarExportResult> {
  const selected = [...new Map(reminders.map(reminder => [reminder.id, reminder])).values()];
  if (!selected.length) throw new Error('Select at least one birthday.');
  let added = 0, existing = 0;
  try {
    const calendarId = await reminderCalendar(token);
    for (const reminder of selected) {
      const event = await googleBirthdayEvent(reminder);
      const response = await googleRequest(token, `/calendars/${encodeURIComponent(calendarId)}/events`, { method: 'POST', body: JSON.stringify(event) });
      // Deterministic event IDs make repeated clicks and partial retries safe.
      if (response.status === 409) existing++;
      else if (response.ok) added++;
      else throw responseError(response);
      onProgress({ added, existing, total: selected.length });
    }
    return { added, existing, total: selected.length, calendarUrl: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(calendarId)}` };
  } catch (error) {
    const reason = error instanceof Error && error.name !== 'TypeError' && error.name !== 'TimeoutError'
      ? error.message : 'Google Calendar could not be reached. Check your connection and try again.';
    throw new Error(`${reason}${added || existing ? ` ${added} added; ${existing} already present. Retry to finish; existing birthdays will be skipped.` : ''}`);
  }
}
