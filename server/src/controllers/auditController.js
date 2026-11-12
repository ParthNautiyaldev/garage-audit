import { AuditLog, publicAuditLog } from '../models/AuditLog.js';
import { RepairOrder } from '../models/RepairOrder.js';
import { ACTIONS } from '../constants.js';
import { failedLoginHotspots, markAnomalies } from '../services/anomalyService.js';
import { asyncHandler, escapeRegex } from '../utils/http.js';

function buildFilter(query) {
  const filter = {};
  if (query.action && ACTIONS.includes(query.action)) filter.action = query.action;
  if (query.status === 'success' || query.status === 'failed') filter.status = query.status;

  const user = String(query.user || '').trim();
  if (user) filter.userName = new RegExp(escapeRegex(user), 'i');

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(`${query.from}T00:00:00`);
    if (query.to) filter.createdAt.$lte = new Date(`${query.to}T23:59:59.999`);
  }

  const q = String(query.q || '').trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [
      { userName: rx },
      { action: rx },
      { resourceType: rx },
      { resourceId: rx },
      { ip: rx },
      { failureReason: rx },
    ];
  }
  return filter;
}

export const listAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 5));
  const filter = buildFilter(req.query);

  const [rows, total, hotspots] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AuditLog.countDocuments(filter),
    failedLoginHotspots(),
  ]);

  res.json({
    logs: markAnomalies(rows.map(publicAuditLog), hotspots),
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    hotspots,
    actions: ACTIONS,
  });
});

export const auditSummary = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [totalLogs, failedLogins24h, sensitiveAccess24h, roleChanges7d, openRepairs, hotspots, recent] = await Promise.all([
    AuditLog.countDocuments(),
    AuditLog.countDocuments({ action: 'AUTH_LOGIN_FAILED', createdAt: { $gte: since } }),
    AuditLog.countDocuments({ action: 'CUSTOMER_SENSITIVE_ACCESS', createdAt: { $gte: since } }),
    AuditLog.countDocuments({ action: 'USER_ROLE_CHANGE', createdAt: { $gte: week } }),
    RepairOrder.countDocuments({ status: { $nin: ['completed', 'cancelled'] } }),
    failedLoginHotspots(),
    AuditLog.find().sort({ createdAt: -1 }).limit(6).lean(),
  ]);

  res.json({
    totalLogs,
    failedLogins24h,
    sensitiveAccess24h,
    roleChanges7d,
    openRepairs,
    hotspots,
    recent: markAnomalies(recent.map(publicAuditLog), hotspots),
  });
});
