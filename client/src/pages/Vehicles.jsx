import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Modal from '../components/Modal.jsx';

const BLANK = { customerId: '', year: 2018, make: '', model: '', plate: '', vin: '' };

export default function Vehicles() {
  const { user } = useAuth();
  const canEdit = user.role === 'admin' || user.role === 'manager';
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [editor, setEditor] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    const [vehicleData, customerData] = await Promise.all([
      api('/api/vehicles'),
      api('/api/customers'),
    ]);
    setVehicles(vehicleData.vehicles);
    setCustomers(customerData.customers);
  }

  useEffect(() => { load().catch((err) => setError(err.message)); }, []);

  async function save(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.target).entries());
    try {
      if (editor.id) await api(`/api/vehicles/${editor.id}`, { method: 'PUT', body });
      else await api('/api/vehicles', { method: 'POST', body });
      setEditor(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(vehicle) {
    if (!confirm(`Delete ${vehicle.plate}?`)) return;
    try {
      await api(`/api/vehicles/${vehicle.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Vehicles</h2>
          <p className="mt-1 text-sm text-muted">Creates, edits, and deletes are stored with the old and new values.</p>
        </div>
        {canEdit && <button className="btn btn-primary" onClick={() => setEditor(BLANK)}>New vehicle</button>}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Plate</th>
              <th className="px-4 py-3 font-medium">Vehicle</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">VIN</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="border-t border-line">
                <td className="px-4 py-3 font-mono">{vehicle.plate}</td>
                <td className="px-4 py-3">{vehicle.year} {vehicle.make} {vehicle.model}</td>
                <td className="px-4 py-3">{vehicle.customerName}</td>
                <td className="px-4 py-3 font-mono text-xs">{vehicle.vin || '—'}</td>
                <td className="px-4 py-3 text-right">
                  {canEdit && <button className="btn btn-ghost" onClick={() => setEditor(vehicle)}>Edit</button>}
                  {canEdit && <button className="btn btn-danger ml-2" onClick={() => remove(vehicle)}>Delete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editor && (
        <Modal title={editor.id ? 'Edit vehicle' : 'New vehicle'} onClose={() => setEditor(null)}>
          <form className="space-y-3" onSubmit={save}>
            <label className="block">
              <span className="label">Customer</span>
              <select className="field" name="customerId" defaultValue={editor.customerId || ''} required>
                <option value="">Select</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className="block"><span className="label">Year</span><input className="field" name="year" type="number" defaultValue={editor.year} required /></label>
              <label className="block"><span className="label">Make</span><input className="field" name="make" defaultValue={editor.make} required /></label>
              <label className="block"><span className="label">Model</span><input className="field" name="model" defaultValue={editor.model} required /></label>
            </div>
            <label className="block"><span className="label">Plate</span><input className="field" name="plate" defaultValue={editor.plate} required /></label>
            <label className="block"><span className="label">VIN</span><input className="field" name="vin" defaultValue={editor.vin || ''} /></label>
            <button className="btn btn-primary" type="submit">Save</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
