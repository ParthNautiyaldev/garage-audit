import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

const DEMOS = [
  ['Admin', 'admin@northline.shop', 'Admin123!'],
  ['Manager', 'manager@northline.shop', 'Manager123!'],
  ['Technician', 'sam@northline.shop', 'Tech123!'],
];

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('admin@northline.shop');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-amber">Northline Auto Works</p>
        <h1 className="mt-2 text-3xl font-semibold">Shop sign in</h1>
        <p className="mt-2 text-sm text-muted">Every attempt, successful or not, is written to the audit log.</p>
        <form onSubmit={onSubmit} className="card mt-6 space-y-4 p-5">
          <label className="block">
            <span className="label">Email</span>
            <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block">
            <span className="label">Password</span>
            <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button className="btn btn-primary w-full" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <div className="mt-4 grid gap-2 text-sm">
          {DEMOS.map(([role, demoEmail, demoPassword]) => (
            <button
              key={demoEmail}
              className="card flex items-center justify-between px-3 py-2 text-left hover:border-amber"
              onClick={() => { setEmail(demoEmail); setPassword(demoPassword); }}
            >
              <span>{role}</span>
              <span className="font-mono text-xs text-muted">{demoEmail}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
