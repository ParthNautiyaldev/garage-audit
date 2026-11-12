import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

const ROLES = ['admin', 'manager', 'technician'];

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    const data = await api('/api/users');
    setUsers(data.users);
  }

  useEffect(() => { load().catch((err) => setError(err.message)); }, []);

  async function changeRole(person, role) {
    if (role === person.role) return;
    if (!confirm(`Change ${person.name} from ${person.role} to ${role}? This is audited.`)) {
      await load();
      return;
    }
    try {
      await api(`/api/users/${person.id}/role`, { method: 'PATCH', body: { role } });
      setNotice(`${person.name} is now ${role}. The change is in the audit log.`);
      setError('');
      await load();
    } catch (err) {
      setError(err.message);
      await load();
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Staff & roles</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Only an admin can change roles. You cannot change your own role, and the shop keeps at least one admin. Both the success and the refusal are logged.
        </p>
      </div>
      {notice && <p className="rounded-md border border-ok/40 bg-ok/10 px-3 py-2 text-sm">{notice}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((person) => (
              <tr key={person.id} className="border-t border-line">
                <td className="px-4 py-3">{person.name}{person.id === user.id ? ' (you)' : ''}</td>
                <td className="px-4 py-3 font-mono text-xs">{person.email}</td>
                <td className="px-4 py-3">
                  <select
                    className="field max-w-xs"
                    value={person.role}
                    disabled={person.id === user.id}
                    onChange={(event) => changeRole(person, event.target.value)}
                  >
                    {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
