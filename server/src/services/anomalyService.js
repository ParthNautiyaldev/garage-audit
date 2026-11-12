import { AuditLog } from '../models/AuditLog.js';
import { FAILED_LOGIN_THRESHOLD, FAILED_LOGIN_WINDOW_MINUTES } from '../constants.js';

/**
 * Group recent failed logins. A group is a hotspot when the same IP and the
 * same attempted user failed at least FAILED_LOGIN_THRESHOLD times.
 * The UI highlights those rows so a password-guessing burst is obvious.
 */
export async function failedLoginHotspots() {
  const since = new Date(Date.now() - FAILED_LOGIN_WINDOW_MINUTES * 60 * 1000);
  const rows = await AuditLog.aggregate([
    { $match: { action: 'AUTH_LOGIN_FAILED', createdAt: { $gte: since } } },
    {
      $group: {
        _id: { ip: '$ip', userName: '$userName' },
        count: { $sum: 1 },
        lastAt: { $max: '$createdAt' },
      },
    },
    { $match: { count: { $gte: FAILED_LOGIN_THRESHOLD } } },
    { $sort: { count: -1 } },
  ]);

  return rows.map((row) => ({
    ip: row._id.ip,
    userName: row._id.userName,
    count: row.count,
    lastAt: row.lastAt,
    windowMinutes: FAILED_LOGIN_WINDOW_MINUTES,
  }));
}

export function markAnomalies(logs, hotspots) {
  const since = Date.now() - FAILED_LOGIN_WINDOW_MINUTES * 60 * 1000;
  return logs.map((log) => {
    const recentFailure = log.action === 'AUTH_LOGIN_FAILED'
      && new Date(log.createdAt).getTime() >= since;
    const clustered = hotspots.some(
      (spot) => spot.ip === log.ip && spot.userName === log.userName,
    );
    return {
      ...log,
      anomaly: Boolean(recentFailure && clustered),
    };
  });
}
