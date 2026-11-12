import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { actionLabel, formatWhen, STATUS_LABEL } from '../constants.js';

export default function Dashboard() {
  const { user } = useAuth();
  const [repairs, setRepairs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api('/api/repairs')
      .then((data) => { if (active) setRepairs(data.repairs); })
      .catch((err) => { if (active) setError(err.message); });
    if (user.role !== 'technician') {
      api('/api/audit/summary')
        .then((data) => { if (active) setSummary(data); })
        .catch(() => {});
    }
    return () => { active = false; };
  }, [user.role]);

  const mine = repairs.filter((repair) => repair.assignedToId === user.id);
  const open = repairs.filter((repair) => !['completed', 'cancelled'].includes(repair.status));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Overview</h2>
        <p className="mt-1 text-sm text-muted">
          {user.role === 'technician'
            ? 'Your assigned jobs are below. Status changes are audited.'
            : 'Shop activity and the security signals worth checking first.'}
        </p>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}

      {summary && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Open repairs" value={summary.openRepairs} />
            <Stat label="Failed logins, 24h" value={summary.failedLogins24h} warn={summary.failedLogins24h >= 3} />
            <Stat label="Sensitive views, 24h" value={summary.sensitiveAccess24h} />
            <Stat label="Role changes, 7d" value={summary.roleChanges7d} />
          </section>
          {summary.hotspots.length > 0 && (
            <div className="rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm">
              <p className="font-medium text-amber">Possible password guessing</p>
              <ul className="mt-2 space-y-1 text-ink">
                {summary.hotspots.map((spot) => (
                  <li key={`${spot.ip}-${spot.userName}`}>
                    {spot.userName} from {spot.ip}: {spot.count} failed logins in {spot.windowMinutes} minutes.
                  </li>
                ))}
              </ul>
              <Link to="/audit" className="mt-2 inline-block text-amber">Open the audit log</Link>
            </div>
          )}
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h3 className="font-medium">Latest audit events</h3>
              <Link to="/audit" className="text-sm text-amber">View all</Link>
            </div>
            <ul>
              {summary.recent.map((log) => (
                <li key={log.id} className={`grid gap-1 border-t border-line px-4 py-3 text-sm md:grid-cols-[160px_1fr_120px] ${log.anomaly ? 'bg-amber/10' : ''}`}>
                  <span className="font-mono text-xs text-muted">{formatWhen(log.createdAt)}</span>
                  <span>{log.userName} · {actionLabel(log.action)}</span>
                  <span className={log.status === 'failed' ? 'text-danger' : 'text-ok'}>{log.status}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <section className="card overflow-hidden">
        <div className="border-b border-line px-4 py-3">
          <h3 className="font-medium">{user.role === 'technician' ? 'Assigned to you' : 'Open work'}</h3>
          <p className="text-xs text-muted">{user.role === 'technician' ? `${mine.length} jobs` : `${open.length} open repairs`}</p>
        </div>
        <ul>
          {(user.role === 'technician' ? mine : open).map((repair) => (
            <li key={repair.id} className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{repair.title}</p>
                <p className="text-muted">{repair.vehicleLabel} · {repair.customerName}</p>
              </div>
              <span className="text-xs uppercase tracking-wide text-amber">{STATUS_LABEL[repair.status]}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, warn }) {
  return (
    <div className={`card p-4 ${warn ? 'border-amber/50' : ''}`}>
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${warn ? 'text-amber' : ''}`}>{value}</p>
    </div>
  );
}
