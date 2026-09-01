import { useState } from 'react';
import { NavLink } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const NAV_ITEMS = [
  { to: '/jobs',     label: 'Jobs',     icon: 'briefcase'          as const },
  { to: '/temps',    label: 'Temps',    icon: 'user-group'         as const },
  { to: '/add-job',  label: 'Add Job',  icon: 'plus'               as const },
  { to: '/add-temp', label: 'Add Temp', icon: 'plus'               as const },
  { to: '/skills',   label: 'Skills',   icon: 'screwdriver-wrench' as const },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-toplayer border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <NavLink to="/" className="inline-flex items-center   hover:text-reversed transition-colors">
          <span className="font-logo  text-4xl text-highlight">R|</span>
  <span className="font-extra text-l tracking-widest text-highlight">RESOURCING</span>
        </NavLink>

        <div className="hidden md:flex gap-1">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                  isActive
                    ? 'bg-highlight text-reversed font-medium'
                    : 'text-secondary hover:text-text hover:bg-border'
                }`
              }
            >
              <FontAwesomeIcon icon={icon} className="text-xs" />
              {label}
            </NavLink>
          ))}
        </div>

       
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 text-secondary hover:text-text transition-colors"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-current transition-all ${open ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-current transition-all ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-current transition-all ${open ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

    
      {open && (
        <div className="md:hidden border-t border-border bg-toplayer">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3 text-sm border-b border-border/40 last:border-0 transition-colors ${
                  isActive ? 'text-highlight font-medium' : 'text-secondary'
                }`
              }
            >
              <FontAwesomeIcon icon={icon} className="w-4" />
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
