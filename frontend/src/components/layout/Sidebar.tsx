import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCalendarTypes } from '../../api/lookups';

const NAV_ITEMS = [
  { label: 'דף הבית', to: '/' },
  { label: 'יומן מתכלל', to: '/scheduling' },
  { label: 'רשימת חברי סגל', to: '/staff' },
  { label: 'רשימת קורסים', to: '/courses' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { data: calTypes } = useQuery({ queryKey: ['calendar-types'], queryFn: getCalendarTypes });

  return (
    <aside className="w-56 bg-primary min-h-screen flex flex-col text-white">
      <div
        className="p-4 cursor-pointer border-b border-primary-dark"
        onClick={() => navigate('/')}
      >
        <h1 className="text-lg font-bold leading-tight">מערכת ניהול יומנים</h1>
        <p className="text-xs text-white/60 mt-0.5">בית ספר מנדל</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `block px-3 py-2 rounded text-sm transition-colors ${
                isActive
                  ? 'bg-white/20 font-semibold'
                  : 'hover:bg-white/10 text-white/80'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}

        <div className="pt-3 pb-1">
          <p className="px-3 text-xs text-white/40 uppercase tracking-wide">יומנים</p>
        </div>
        {calTypes?.filter(ct => !['חופשות', 'זמנים קרן מנדל', 'זמנים בית ספריים'].includes(ct.name))
          .map(ct => (
            <NavLink
              key={ct.id}
              to={`/calendar/${ct.id}`}
              className={({ isActive }) =>
                `block px-3 py-1.5 rounded text-sm transition-colors ${
                  isActive ? 'bg-white/20 font-semibold' : 'hover:bg-white/10 text-white/80'
                }`
              }
            >
              {ct.name}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
}
