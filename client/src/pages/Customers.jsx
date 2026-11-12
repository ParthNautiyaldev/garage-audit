import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Modal from '../components/Modal.jsx';

const BLANK = { name: '', phone: '', email: '', address: '', notes: '' };

export default function Customers() {
  const { user } = useAuth();
  const canEdit = user.role === 'admin' || user.role === 'manager';
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editor, setEditor] = useState(null);
  const [detail, setDetail] = useState(null);

  async function load(q = query) {
    const data = await api(`/api/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`);
    setCustomers(data.customers);
  }

  useEffect(() => { load('').catch((err) => setError(err.message)); }, []);

  async function openEditor(customer) {
    setError('');
    try {
      const data = await api(`/api/customers/${customer.id}`);
      setEditor(data.customer);
    } catch (err) {
      setError(err.message);
    }
  }

  async function openDetail(customer) {
    setError('');
    try {
      const data = await api(`/api/customers/${customer.id}`);
      setDetail(data.customer);
      setNotice(`Opened ${data.customer.name}. This view was written to the audit log.`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function save(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.target).entries());
    try {
      if (editor.id) await api(`/api/customers/${editor.id}`, { method: 'PUT', body });
      else await api('/api/customers', { method: 'POST', body });
      setEditor(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(customer) {
    if (!confirm(`Delete ${customer.name}?`)) return;
    try {
      await api(`/api/customers/${customer.id}`, { method: 'DELETE' });
      if (detail?.id === customer.id) setDetail(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Customers</h2>
          <p className="mt-1 text-sm text-muted">The list hides the address and notes. Opening a record is a sensitive access.</p>
        </div>
        {canEdit && <button className="btn btn-primary" onClick={() => setEditor(BLANK)}>New customer</button>}
      </div>
      {notice && <p className="rounded-md border border-info/40 bg-info/10 px-3 py-2 text-sm">{notice}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); load().catch((err) => setError(err.message)); }}>
        <input className="field max-w-sm" placeholder="Search by name" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className="btn btn-ghost" type="submit">Search</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Vehicles</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-line">
                  <td className="px-4 py-3">{customer.name}</td>
                  <td className="px-4 py-3">{customer.phone}</td>
                  <td className="px-4 py-3">{customer.email}</td>
                  <td className="px-4 py-3">{customer.vehicleCount}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn btn-ghost" onClick={() => openDetail(customer)}>View record</button>
                    {canEdit && <button className="btn btn-ghost ml-2" onClick={() => openEditor(customer)}>Edit</button>}
                    {canEdit && <button className="btn btn-danger ml-2" onClick={() => remove(customer)}>Delete</button>}
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="card p-4">
          <h3 className="font-medium">{detail.name}</h3>
          <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
            <div><dt className="label">Address</dt><dd>{detail.address}</dd></div>
            <div><dt className="label">Notes</dt><dd>{detail.notes || 'No notes'}</dd></div>
          </dl>
        </div>
      )}

      {editor && (
        <Modal title={editor.id ? 'Edit customer' : 'New customer'} onClose={() => setEditor(null)}>
          <form className="space-y-3" onSubmit={save}>
            {['name', 'phone', 'email', 'address'].map((field) => (
              <label key={field} className="block">
                <span className="label">{field}</span>
                <input className="field" name={field} defaultValue={editor[field] || ''} required />
              </label>
            ))}
            <label className="block">
              <span className="label">Notes</span>
              <textarea className="field min-h-24" name="notes" defaultValue={editor.notes || ''} />
            </label>
            <button className="btn btn-primary" type="submit">Save</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
