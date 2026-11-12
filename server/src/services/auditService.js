import { AuditLog } from '../models/AuditLog.js';
import { clientIp } from '../utils/http.js';

const SECRET_KEYS = new Set(['password', 'passwordHash', 'token', 'jwt']);

// Passwords and tokens must never land in the log, even if a caller passes them.
function redact(value) {
  if (value == null || typeof value !== 'object') return value ?? null;
  if (Array.isArray(value)) return value.map(redact);
  const clean = {};
  for (const [key, nested] of Object.entries(value)) {
    clean[key] = SECRET_KEYS.has(key) ? '[redacted]' : redact(nested);
  }
  return clean;
}

/**
 * Write one audit event and wait for it.
 * Mutations await this before they respond. If the write fails, the request
 * fails too, so an action that was not recorded does not look successful.
 */
export async function recordAudit(req, event) {
  const user = req.user || null;
  await AuditLog.create({
    userId: event.userId !== undefined ? event.userId : user?._id || null,
    userName: event.userName || user?.name || 'unknown',
    userRole: event.userRole !== undefined ? event.userRole : user?.role || null,
    action: event.action,
    resourceType: event.resourceType,
    resourceId: event.resourceId ? String(event.resourceId) : null,
    ip: clientIp(req),
    userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
    oldValue: redact(event.oldValue ?? null),
    newValue: redact(event.newValue ?? null),
    status: event.status,
    failureReason: event.failureReason || null,
  });
}
