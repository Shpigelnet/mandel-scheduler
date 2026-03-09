interface Props {
  text: string;
  className?: string;
}

// Map calendar-type names to colors (from screenshots)
const CAL_COLORS: Record<string, string> = {
  'שנה א':                    'bg-teal-100 text-teal-800 border-teal-200',
  'שנה ב':                    'bg-sky-100 text-sky-800 border-sky-200',
  'מיון':                     'bg-purple-100 text-purple-800 border-purple-200',
  'דמוקרטיה':                 'bg-amber-100 text-amber-800 border-amber-200',
  'זמנים בית ספריים':         'bg-green-100 text-green-800 border-green-200',
  'זמנים קרן מנדל':           'bg-emerald-100 text-emerald-800 border-emerald-200',
  'חופשות':                   'bg-gray-100 text-gray-600 border-gray-200',
  'המרכז למדיניות בחינוך':    'bg-indigo-100 text-indigo-800 border-indigo-200',
};

export function CalendarTag({ name }: { name: string }) {
  const cls = CAL_COLORS[name] ?? 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {name}
    </span>
  );
}

// Color-coded availability status line
export function AvailabilityLine({ line }: { line: string }) {
  let cls = 'text-gray-700';
  if (line.startsWith('✅')) cls = 'text-green-700';
  else if (line.startsWith('❌')) cls = 'text-red-600';
  else if (line.startsWith('🟡')) cls = 'text-yellow-700';
  else if (line.startsWith('🔴') || line.includes('🔴')) cls = 'text-red-600 font-semibold';
  else if (line.startsWith('🟠')) cls = 'text-orange-600';
  else if (line.startsWith('📅')) cls = 'text-blue-600';
  else if (line.startsWith('⛔')) cls = 'text-red-700 font-semibold';
  else if (line.startsWith('⚪')) cls = 'text-gray-400';
  return <div className={cls}>{line}</div>;
}

export function StatusTagBlock({ text, className = '' }: Props) {
  if (!text) return <span className="text-gray-300 text-xs">—</span>;
  const lines = text.split('\n');
  return (
    <div className={`space-y-0.5 ${className}`}>
      {lines.map((l, i) => (
        <AvailabilityLine key={i} line={l} />
      ))}
    </div>
  );
}
