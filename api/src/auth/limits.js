// Per-process limits also apply to unknown emails, so responses do not reveal accounts.
export function createCooldown(delayMs = 60_000) {
  const deadlines = new Map();
  return (key, res) => {
    const now = Date.now();
    for (const [entry, deadline] of deadlines) if (deadline <= now) deadlines.delete(entry);
    const deadline = deadlines.get(key);
    if (deadline) return rateLimited(res, Math.ceil((deadline - now) / 1000));
    deadlines.set(key, now + delayMs);
    return false;
  };
}

export function rateLimited(res, seconds = 60) {
  res.set('Retry-After', String(seconds));
  res.status(429).json({ ok: false, error: { code: 'RATE_LIMITED', message: `Thử lại sau ${seconds} giây.` } });
  return true;
}
