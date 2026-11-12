export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Keep only the fields that actually changed, so the log stays readable.
export function changedFields(before, after, keys) {
  const oldValue = {};
  const newValue = {};
  for (const key of keys) {
    const prev = before?.[key] ?? null;
    const next = after?.[key] ?? null;
    if (String(prev) !== String(next)) {
      oldValue[key] = prev;
      newValue[key] = next;
    }
  }
  return { oldValue, newValue, changed: Object.keys(newValue).length > 0 };
}

export function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  let ip = typeof forwarded === 'string' && forwarded.length
    ? forwarded.split(',')[0].trim()
    : req.ip || '';
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);
  if (ip === '::1') ip = '127.0.0.1';
  return ip || 'unknown';
}
