import { cookies } from 'next/headers';
import { getSecret, sign, verifySignature, randomId } from './secrets';

const COOKIE_NAME = 'lm_sesi';
const MAX_AGE = 60 * 60 * 24 * 30;

export function serializeSession(sessionId) {
  return `${sessionId}.${sign([sessionId], 'APP_SECRET')}`;
}

export function parseSession(raw) {
  if (typeof raw !== 'string') return null;
  const idx = raw.lastIndexOf('.');
  if (idx <= 0) return null;
  const sessionId = raw.slice(0, idx);
  const signature = raw.slice(idx + 1);
  const expected = sign([sessionId], 'APP_SECRET');
  if (!verifySignature(expected, signature)) return null;
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(sessionId)) return null;
  return sessionId;
}

export async function readSessionId() {
  const jar = await cookies();
  return parseSession(jar.get(COOKIE_NAME)?.value) || null;
}

export async function ensureSessionId() {
  const jar = await cookies();
  const existing = parseSession(jar.get(COOKIE_NAME)?.value);
  if (existing) return { sessionId: existing, rotate: false };
  return { sessionId: randomId(18), rotate: true };
}

export function sessionCookie(sessionId) {
  return {
    name: COOKIE_NAME,
    value: serializeSession(sessionId),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  };
}
