import { Fragment, useEffect, useState } from 'react';
import { api } from '../api.js';
import { ACTION_LABEL, actionLabel, formatWhen } from '../constants.js';

const EMPTY = { q: '', user: '', action: '', status: '', from: '', to: '', page: 1 };

export default function AuditLogs() {
  const [draft, setDraft] = useState(EMPTY);
  const [applied, setApplied] = useState(EMPTY);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(applied).forEach(([key, value]) => { if (value) params.set(key, value); });
    let active = true;
    setLoading(true);
    api(`/api/audit?${params.toString()}`)
      .then((next) => { if (active) { setData(next); setError(''); } })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [applied]);

  function apply(event) {
    event.preventDefault();
    setApplied({ ...draft, page: 1 });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Audit log</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Sign-ins, role changes, record edits, and sensitive customer views. Failed logins that cluster on one person and one address are highlighted.
        </p>
      </div>

      {data?.hotspots?.length > 0 && (
        <div className="rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm">
          {data.hotspots.map((spot) => (
            <p key={`${spot.ip}-${spot.userName}`}>
              <span className="font-medium text-amber">Anomaly.</span> {spot.count} failed logins for {spot.userName} from {spot.ip} in the last {spot.windowMinutes} minutes.
            </p>
          ))}
        </div>
      )}

      <form onSubmit={apply} className="card grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-6">
        <label className="block xl:col-span-2">
          <span className="label">Search</span>
          <input className="field" value={draft.q} placeholder="Action, IP, resource" onChange={(e) => setDraft({ ...draft, q: e.target.value })} />
        </label>
        <label className="block">
          <span className="label">User</span>
          <input className="field" value={draft.user} placeholder="Name" onChange={(e) => setDraft({ ...draft, user: e.target.value })} />
        </label>
        <label className="block">
          <span className="label">Action</span>
          <select className="field" value={draft.action} onChange={(e) => setDraft({ ...draft, action: e.target.value })}>
            <option value="">All</option>
            {Object.entries(ACTION_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">Status</span>
          <select className="field" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <label className="block">
          <span className="label">From</span>
          <input className="field" type="date" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
        </label>
        <label className="block">
          <span className="label">To</span>
          <input className="field" type="date" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
        </label>
        <div className="flex items-end gap-2 md:col-span-2 xl:col-span-4">
          <button className="btn btn-primary" type="submit">Apply filters</button>
          <button className="btn btn-ghost" type="button" onClick={() => { setDraft(EMPTY); setApplied(EMPTY); }}>Reset</button>
        </div>
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Resource</th>
              <th className="px-4 py-3 font-medium">IP</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="px-4 py-6 text-muted" colSpan={6}>Loading logs…</td></tr>}
            {!loading && data?.logs?.length === 0 && <tr><td className="px-4 py-6 text-muted" colSpan={6}>No events match those filters.</td></tr>}
            {data?.logs?.map((log) => (
              <Fragment key={log.id}>
                <tr
                  className={`cursor-pointer border-t border-line ${log.anomaly ? 'bg-amber/10' : 'hover:bg-panel-2'}`}
                  onClick={() => setOpenId(openId === log.id ? null : log.id)}
                >
                  <td className="px-4 py-3 font-mono text-xs">{formatWhen(log.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div>{log.userName}</div>
                    <div className="text-xs text-muted">{log.userRole || 'unknown'}</div>
                  </td>
                  <td className="px-4 py-3">
                    {actionLabel(log.action)}
                    {log.anomaly && <span className="ml-2 rounded bg-amber px-1.5 py-0.5 text-[10px] font-semibold uppercase text-bg">Anomaly</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div>{log.resourceType}</div>
                    <div className="font-mono text-xs text-muted">{log.resourceId || '—'}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{log.ip}</td>
                  <td className={`px-4 py-3 ${log.status === 'failed' ? 'text-danger' : 'text-ok'}`}>{log.status}</td>
                </tr>
                {openId === log.id && (
                  <tr className="border-t border-line bg-bg">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <ValueBlock title="Old value" value={log.oldValue} />
                        <ValueBlock title="New value" value={log.newValue} />
                      </div>
                      {log.failureReason && <p className="mt-3 text-sm text-danger">Failure: {log.failureReason}</p>}
                      {log.userAgent && <p className="mt-2 font-mono text-xs text-muted">{log.userAgent}</p>}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {data && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted">{data.total} events · page {data.page} of {data.pages}</p>
          <div className="flex gap-2">
            <button className="btn btn-ghost" disabled={data.page <= 1} onClick={() => setApplied({ ...applied, page: applied.page - 1 })}>Previous</button>
            <button className="btn btn-ghost" disabled={data.page >= data.pages} onClick={() => setApplied({ ...applied, page: applied.page + 1 })}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ValueBlock({ title, value }) {
  return (
    <div>
      <p className="label">{title}</p>
      <pre className="overflow-x-auto rounded-md border border-line bg-panel p-3 font-mono text-xs text-ink">
        {value ? JSON.stringify(value, null, 2) : '—'}
      </pre>
    </div>
  );
}
