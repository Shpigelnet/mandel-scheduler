import { useState, useRef, useEffect } from 'react';
import Fuse from 'fuse.js';

interface Option {
  id: string;
  name: string;
}

interface Props {
  options: Option[];
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  className?: string;
}

function normaliseHebrew(s: string): string {
  return s.replace(/ך/g, 'כ').replace(/ם/g, 'מ').replace(/ן/g, 'נ').replace(/ף/g, 'פ').replace(/ץ/g, 'צ');
}

export default function MultiLookupSelect({ options, value, onChange, placeholder = 'בחר...', className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.filter(o => value.includes(o.id));

  const fuse = new Fuse(options, {
    keys: ['name'],
    threshold: 0.4,
    getFn: (obj, path) => normaliseHebrew(String((obj as any)[path as string])),
  });
  const filtered = query ? fuse.search(normaliseHebrew(query)).map(r => r.item) : options;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="w-full text-right px-2 py-1 border border-gray-200 rounded bg-white hover:border-primary text-sm min-h-[30px] flex flex-wrap gap-1 items-center"
      >
        {selected.length === 0
          ? <span className="text-gray-400">{placeholder}</span>
          : selected.map(s => (
            <span key={s.id} className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs">
              {s.name}
            </span>
          ))
        }
        <span className="text-gray-400 text-xs mr-auto">▾</span>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full min-w-[200px] bg-white border border-gray-200 rounded shadow-lg">
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
            {filtered.map(opt => (
              <li
                key={opt.id}
                onMouseDown={() => toggle(opt.id)}
                className="px-3 py-1.5 text-sm cursor-pointer hover:bg-cream flex items-center gap-2"
              >
                <span className={`w-4 h-4 border rounded flex items-center justify-center text-xs flex-shrink-0 ${value.includes(opt.id) ? 'bg-primary border-primary text-white' : 'border-gray-300'}`}>
                  {value.includes(opt.id) ? '✓' : ''}
                </span>
                {opt.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
