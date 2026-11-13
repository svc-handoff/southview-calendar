import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers.js';
import { updatePrivateDocument } from '../private-store.ts';

export const adminCookie = 'southview_admin';
export const sessionLifetime = 8 * 60 * 60;
function secret() { const value = process.env.ADMIN_SESSION_SECRET; if (!value || value.length < 32) throw new Error('Staff sign-in is not configured.'); return value; }
function equal(a: string, b: string) {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
function signature(body: string) { return createHmac('sha256', secret()).update(`${body}:${process.env.ADMIN_PASSWORD_HASH}`).digest('base64url'); }
export function createSession(now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ exp: now + sessionLifetime * 1000, nonce: randomBytes(16).toString('hex') })).toString('base64url');
  return `${body}.${signature(body)}`;
}
export function validSession(token: string, now = Date.now()) {
  try {
    const [body, mac, extra] = token.split('.');
    if (!body || !mac || extra || !equal(signature(body), mac)) return false;
    const data = JSON.parse(Buffer.from(body, 'base64url').toString());
    return Number.isFinite(data.exp) && data.exp > now && data.exp <= now + sessionLifetime * 1000;
  } catch { return false; }
}
export async function isAdmin() { return validSession((await cookies()).get(adminCookie)?.value || ''); }
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return origin === new URL(request.url).origin && request.headers.get('sec-fetch-site') !== 'cross-site';
}
export function verifyCredentials(email: string, password: string) {
  const stored = process.env.ADMIN_PASSWORD_HASH || '';
  const [salt, hash] = stored.split(':');
  if (!salt || !hash || !process.env.ADMIN_EMAIL || password.length > 300) return false;
  const actual = scryptSync(password, Buffer.from(salt, 'hex'), 64).toString('hex');
  return equal(actual, hash) && equal(email.trim().toLowerCase(), process.env.ADMIN_EMAIL.toLowerCase());
}
// Persisted limits apply across serverless instances; neither names nor IPs are stored here.
export async function allowLogin(request: Request) {
  const ip = request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'local';
  const key = createHmac('sha256', secret()).update(ip.split(',')[0].trim()).digest('hex');
  const now = Date.now();
  return updatePrivateDocument<Record<string, { count: number; expires: number }>, boolean>('admin/login-limits.json', {}, data => {
    for (const k of Object.keys(data)) if (data[k].expires <= now) delete data[k];
    for (const [k, limit] of [[key, 8], ['all', 100]] as const) {
      if ((data[k]?.count || 0) >= limit) return { data, result: false };
    }
    for (const k of [key, 'all']) data[k] = { count: (data[k]?.count || 0) + 1, expires: data[k]?.expires || now + 15 * 60 * 1000 };
    return { data, result: true };
  });
}
