import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

const LINKS = [
  { to: '/', label: 'Overview', end: true, roles: ['admin', 'manager', 'technician'] },
  { to: '/repairs', label: 'Repairs', roles: ['admin', 'manager', 'technician'] },
  { to: '/vehicles', label: 'Vehicles', roles: ['admin', 'manager', 'technician'] },
  { to: '/customers', label: 'Customers', roles: ['admin', 'manager', 'technician'] },
  { to: '/users', label: 'Staff & roles', roles: ['admin'] },
  { to: '/audit', label: 'Audit log', roles: ['admin', 'manager'] },
];

const ROLE_TONE = {
  admin: 'text-amber',
  manager: 'text-info',
  technician: 'text-ok',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const links = LINKS.filter((link) => link.roles.includes(user.role));

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-panel md:border-b-0 md:border-r">
        <div className="px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-amber">Northline</p>
          <h1 className="mt-1 text-lg font-semibold leading-tight">Auto Works</h1>
          <p className="mt-1 text-xs text-muted">Audit & activity monitor</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-1 md:px-3 md:pb-6">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `block whitespace-nowrap rounded-md px-3 py-2 text-sm ${isActive ? 'bg-panel-2 text-amber' : 'text-muted hover:bg-panel-2 hover:text-ink'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-between border-b border-line px-4 py-3 md:px-8">
          <p className="text-sm text-muted">Signed in as <span className="text-ink">{user.name}</span></p>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium uppercase tracking-wider ${ROLE_TONE[user.role]}`}>{user.role}</span>
            <button className="btn btn-ghost" onClick={logout}>Log out</button>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
