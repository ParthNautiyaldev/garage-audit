import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { REPAIR_STATUSES, STATUS_LABEL } from '../constants.js';
import Modal from '../components/Modal.jsx';

const BLANK = { title: '', vehicleId: '', assignedToId: '', description: '', laborCost: 0, partsCost: 0, status: 'received' };

export default function Repairs() {
  const { user } = useAuth();
  const canManage = user.role === 'admin' || user.role === 'manager';
  const [repairs, setRepairs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [editor, setEditor] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    const requests = [api('/api/repairs'), api('/api/vehicles')];
    if (canManage) requests.push(api('/api/users/assignees'));
    const [repairData, vehicleData, assigneeData] = await Promise.all(requests);
    setRepairs(repairData.repairs);
    setVehicles(vehicleData.vehicles);
    setAssignees(assigneeData?.users || []);
  }

  useEffect(() => { load().catch((err) => setError(err.message)); }, []);

  async function save(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.target).entries());
    try {
      if (editor.id) await api(`/api/repairs/${editor.id}`, { method: 'PUT', body });
      else await api('/api/repairs', { method: 'POST', body });
      setEditor(null);
      setError('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function changeStatus(repair, status) {
    try {
      await api(`/api/repairs/${repair.id}/status`, { method: 'PATCH', body: { status } });
      setError('');
      await load();
    } catch (err) {
      setError(err.message);
      await load();
    }
  }

  async function remove(repair) {
    if (!confirm(`Delete “${repair.title}”?`)) return;
    try {
      await api(`/api/repairs/${repair.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Repairs</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Status changes are their own audit event. Technicians can update only the jobs assigned to them — other attempts are denied and logged.
          </p>
        </div>
        {canManage && <button className="btn btn-primary" onClick={() => setEditor(BLANK)}>New repair</button>}
      </div>
      {error && <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
      <div className="grid gap-3">
        {repairs.map((repair) => (
          <article key={repair.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-medium">{repair.title}</h3>
                <p className="mt-1 text-sm text-muted">{repair.vehicleLabel} · {repair.customerName}</p>
                <p className="mt-1 text-sm text-muted">Assigned to {repair.assignedToName}</p>
                {repair.description && <p className="mt-2 text-sm">{repair.description}</p>}
              </div>
              <div className="text-right text-sm">
                <p className="font-mono">${repair.laborCost + repair.partsCost}</p>
                <p className="text-xs text-muted">labor {repair.laborCost} · parts {repair.partsCost}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <select
                className="field max-w-xs"
                value={repair.status}
                onChange={(event) => changeStatus(repair, event.target.value)}
              >
                {REPAIR_STATUSES.map((status) => (
                  <option key={status} value={status}>{STATUS_LABEL[status]}</option>
                ))}
              </select>
              {canManage && <button className="btn btn-ghost" onClick={() => setEditor(repair)}>Edit</button>}
              {canManage && <button className="btn btn-danger" onClick={() => remove(repair)}>Delete</button>}
            </div>
          </article>
        ))}
      </div>
      {editor && (
        <Modal title={editor.id ? 'Edit repair' : 'New repair'} onClose={() => setEditor(null)}>
          <form className="space-y-3" onSubmit={save}>
            <label className="block"><span className="label">Title</span><input className="field" name="title" defaultValue={editor.title} required /></label>
            {!editor.id && (
              <label className="block">
                <span className="label">Vehicle</span>
                <select className="field" name="vehicleId" defaultValue="" required>
                  <option value="">Select</option>
                  {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.label}</option>)}
                </select>
              </label>
            )}
            <label className="block">
              <span className="label">Assign to</span>
              <select className="field" name="assignedToId" defaultValue={editor.assignedToId || ''}>
                <option value="">Unassigned</option>
                {assignees.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.role}</option>)}
              </select>
            </label>
            {!editor.id && (
              <label className="block">
                <span className="label">Starting status</span>
                <select className="field" name="status" defaultValue="received">
                  {REPAIR_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
                </select>
              </label>
            )}
            <label className="block"><span className="label">Description</span><textarea className="field min-h-20" name="description" defaultValue={editor.description || ''} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="label">Labor</span><input className="field" name="laborCost" type="number" min="0" defaultValue={editor.laborCost || 0} /></label>
              <label className="block"><span className="label">Parts</span><input className="field" name="partsCost" type="number" min="0" defaultValue={editor.partsCost || 0} /></label>
            </div>
            <button className="btn btn-primary" type="submit">Save</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
