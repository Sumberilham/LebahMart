const buckets = new Map();
const HARD_MAX_KEYS = 50000;

function prune(now) {
  if (buckets.size < HARD_MAX_KEYS) return;
  for (const [key, win] of buckets) {
    if (now - win.start > win.windowMs) buckets.delete(key);
  }
}

export function rateLimit({ key, limit, windowMs }) {
  const now = Date.now();
  prune(now);
  let win = buckets.get(key);
  if (!win || now - win.start > windowMs) {
    win = { start: now, count: 0, windowMs };
    buckets.set(key, win);
  }
  win.count += 1;
  if (win.count > limit) {
    return { ok: false, retryAfterMs: Math.max(0, win.start + windowMs - now) };
  }
  return { ok: true, remaining: limit - win.count };
}

export function resetRateLimits() {
  buckets.clear();
}
