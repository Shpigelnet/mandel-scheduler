import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import GeometricPattern from '../components/layout/GeometricPattern';
import { getCalendarTypes } from '../api/lookups';

function HeroCard({ title, subtitle, onClick }: { title: string; subtitle?: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-primary text-white rounded-lg overflow-hidden hover:bg-primary-dark transition-colors flex flex-col"
      style={{ minHeight: 180 }}
    >
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div>
          <h2 className="text-2xl font-bold leading-tight">{title}</h2>
          {subtitle && <p className="text-sm text-white/70 mt-2 leading-relaxed">{subtitle}</p>}
        </div>
      </div>
      <GeometricPattern />
    </div>
  );
}

function InternalTableCard({ label, to }: { label: string; to: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="border border-gray-200 rounded px-4 py-2 text-sm text-primary hover:bg-cream-dark transition-colors flex items-center gap-2"
    >
      <span>↗</span>
      {label}
    </button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { data: calTypes } = useQuery({ queryKey: ['calendar-types'], queryFn: getCalendarTypes });

  const yearA = calTypes?.find(c => c.name === 'שנה א');
  const yearB = calTypes?.find(c => c.name === 'שנה ב');

  const sideLinks = [
    { label: 'שנה א', id: yearA?.id },
    { label: 'שנה ב', id: yearB?.id },
    { label: 'המרכז למדיניות בחינוך', id: calTypes?.find(c => c.name === 'המרכז למדיניות בחינוך')?.id },
    { label: 'תוכנית דמוקרטיה', id: calTypes?.find(c => c.name === 'דמוקרטיה')?.id },
    { label: 'תהליכי מיון', id: calTypes?.find(c => c.name === 'מיון')?.id },
  ];

  return (
    <div className="flex gap-6 p-6">
      {/* Side nav links */}
      <div className="flex flex-col gap-2 min-w-[160px]">
        {sideLinks.map(link => (
          <button
            key={link.label}
            disabled={!link.id}
            onClick={() => link.id && navigate(`/calendar/${link.id}`)}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm text-right hover:bg-cream-dark transition-colors flex items-center gap-1.5 disabled:opacity-40"
          >
            <span className="text-xs">↗</span>
            {link.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 space-y-6">
        {/* Hero cards row */}
        <div className="grid grid-cols-2 gap-4">
          <HeroCard
            title="מעבר ליומנים נפרדים"
            onClick={() => navigate(yearA ? `/calendar/${yearA.id}` : '/scheduling')}
          />
          <div
            onClick={() => navigate('/scheduling')}
            className="cursor-pointer bg-cream-dark rounded-lg overflow-hidden border border-gray-200 hover:border-primary transition-colors flex flex-col"
          >
            <div className="flex-1 p-6">
              <h2 className="text-3xl font-bold text-primary">יומן מתכלל</h2>
              <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                תוכנית בית ספר מנדל למנהיגות חינוכית<br />
                המרכז למדיניות בחינוך<br />
                תוכנית מנדל למנהיגות חינוכית לדמוקרטיה<br />
                תהליכי מיון
              </p>
            </div>
            <GeometricPattern />
            <div className="p-3 text-left">
              <button className="text-xs border border-gray-300 rounded px-2 py-1 hover:bg-white transition-colors">
                ↗ ליומן המתכלל
              </button>
            </div>
          </div>
        </div>

        {/* Internal tables */}
        <div className="bg-cream-dark rounded-lg p-4">
          <div className="text-center mb-3">
            <h3 className="text-xl font-bold text-primary">טבלאות פנימיות</h3>
          </div>
          <GeometricPattern className="mb-4" />
          <div className="flex flex-wrap gap-2 justify-center">
            <InternalTableCard label="רשימת חברי סגל" to="/staff" />
            <InternalTableCard label="זמינות חברי סגל" to="/staff" />
            <InternalTableCard label="תחומי דעת" to="/courses" />
            <InternalTableCard label="רשימת קורסים" to="/courses" />
          </div>
        </div>
      </div>
    </div>
  );
}
