import { useState, useRef, useEffect } from 'react';
import Fuse from 'fuse.js';

interface Option {
  id: string;
  name: string;
}

interface Props {
  options: Option[];
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  clearable?: boolean;
  className?: string;
}

// Normalise final-form Hebrew letters for fuzzy matching
function normaliseHebrew(s: string): string {
  return s
    .replace(/ך/g, 'כ')
    .replace(/ם/g, 'מ')
    .replace(/ן/g, 'נ')
    .replace(/ף/g, 'פ')
    .replace(/ץ/g, 'צ');
}

export default function LookupSelect({ options, value, onChange, placeholder = 'בחר...', clearable = true, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.id === value) ?? null;

  const fuse = new Fuse(options, {
    keys: ['name'],
    threshold: 0.4,
    getFn: (obj, path) => normaliseHebrew(String((obj as any)[path as string])),
  });

  const filtered = query
    ? fuse.search(normaliseHebrew(query)).map(r => r.item)
    : options;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleOpen() {
    setOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function select(opt: Option) {
    onChange(opt.id);
    setOpen(false);
    setQuery('');
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleOpen}
        className="w-full text-right px-2 py-1 border border-gray-200 rounded bg-white hover:border-primary text-sm flex items-center justify-between gap-1 min-h-[30px]"
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected?.name ?? placeholder}
        </span>
        <span className="text-gray-400 text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full min-w-[180px] bg-white border border-gray-200 rounded shadow-lg">
          <div className="p-1 border-b border-gray-100">
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="חיפוש..."
              className="w-full text-sm px-2 py-1 border border-gray-200 rounded outline-none focus:border-primary"
              dir="rtl"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto">
            {clearable && (
              <li
                className="px-3 py-1.5 text-sm text-gray-400 cursor-pointer hover:bg-gray-50"
                onMouseDown={() => { onChange(null); setOpen(false); }}
              >
                — ללא —
              </li>
            )}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400">אין תוצאות</li>
            )}
            {filtered.map(opt => (
              <li
                key={opt.id}
                onMouseDown={() => select(opt)}
                className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-cream ${opt.id === value ? 'bg-primary/10 font-medium' : ''}`}
              >
                {opt.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
