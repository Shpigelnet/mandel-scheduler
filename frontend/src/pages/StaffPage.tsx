import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStaff, createStaff, updateStaff, deleteStaff, getAvailability, createAvailability, deleteAvailability, getAbsences, createAbsence, deleteAbsence } from '../api/staff';
import type { Staff, RegularAvailability, Absence, StaffStatus, DayOfWeek, AvailabilityType } from '../api/types';
import GeometricPattern from '../components/layout/GeometricPattern';

const DAYS: DayOfWeek[] = ['יום א', 'יום ב', 'יום ג', 'יום ד', 'יום ה'];
const AVAIL_OPTS: AvailabilityType[] = ['זמינות מלאה', 'זמין בתיאום מראש', 'לא זמין'];
const STATUS_OPTS: StaffStatus[] = ['ליבה', 'סגל קרן מנדל', 'ספק', 'אורח'];

const STATUS_BADGE: Record<StaffStatus, string> = {
  'ליבה':           'bg-primary/10 text-primary',
  'סגל קרן מנדל':  'bg-emerald-100 text-emerald-800',
  'ספק':            'bg-orange-100 text-orange-800',
  'אורח':           'bg-gray-100 text-gray-600',
};

function AvailabilityPanel({ staff }: { staff: Staff }) {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({ queryKey: ['availability', staff.id], queryFn: () => getAvailability(staff.id) });
  const addMut = useMutation({
    mutationFn: (b: Partial<RegularAvailability>) => createAvailability(staff.id, b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['availability', staff.id] }),
  });
  const delMut = useMutation({
    mutationFn: (avid: string) => deleteAvailability(staff.id, avid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['availability', staff.id] }),
  });

  const [form, setForm] = useState({ day_of_week: 'יום ב' as DayOfWeek, availability: 'זמינות מלאה' as AvailabilityType, time_start: '', time_end: '', notes: '' });

  return (
    <div className="mt-2 text-xs space-y-2">
      <table className="w-full">
        <thead>
          <tr className="text-gray-500">
            <th className="text-right font-normal py-0.5">יום</th>
            <th className="text-right font-normal">זמינות</th>
            <th className="text-right font-normal">שעות חסומות</th>
            <th className="text-right font-normal">הערות</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-t border-gray-100">
              <td className="py-0.5 pr-1">{r.day_of_week}</td>
              <td>{r.availability}</td>
              <td>{r.time_start && r.time_end ? `${r.time_start}–${r.time_end}` : '—'}</td>
              <td className="text-gray-500">{r.notes ?? '—'}</td>
              <td>
                <button onClick={() => delMut.mutate(r.id)} className="text-red-400 hover:text-red-600 px-1">×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-1 items-end flex-wrap pt-1 border-t border-gray-100">
        <select value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: e.target.value as DayOfWeek }))}
          className="border rounded px-1 py-0.5 text-xs">
          {DAYS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={form.availability} onChange={e => setForm(f => ({ ...f, availability: e.target.value as AvailabilityType }))}
          className="border rounded px-1 py-0.5 text-xs">
          {AVAIL_OPTS.map(o => <option key={o}>{o}</option>)}
        </select>
        <input type="time" value={form.time_start} onChange={e => setForm(f => ({ ...f, time_start: e.target.value }))}
          className="border rounded px-1 py-0.5 text-xs w-24" placeholder="משעה" />
        <input type="time" value={form.time_end} onChange={e => setForm(f => ({ ...f, time_end: e.target.value }))}
          className="border rounded px-1 py-0.5 text-xs w-24" placeholder="עד שעה" />
        <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          className="border rounded px-1 py-0.5 text-xs flex-1 min-w-[80px]" placeholder="הערות" />
        <button onClick={() => addMut.mutate(form)} className="bg-primary text-white rounded px-2 py-0.5 text-xs hover:bg-primary-dark">+ הוסף</button>
      </div>
    </div>
  );
}

function AbsencesPanel({ staff }: { staff: Staff }) {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({ queryKey: ['absences', staff.id], queryFn: () => getAbsences(staff.id) });
  const addMut = useMutation({
    mutationFn: (b: Partial<Absence>) => createAbsence(staff.id, b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['absences', staff.id] }),
  });
  const delMut = useMutation({
    mutationFn: (aid: string) => deleteAbsence(staff.id, aid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['absences', staff.id] }),
  });

  const [form, setForm] = useState({ start_date: '', end_date: '', notes: '' });

  return (
    <div className="mt-2 text-xs space-y-2">
      {rows.map(r => (
        <div key={r.id} className="flex gap-2 items-center border-b border-gray-100 pb-1">
          <span>{r.start_date.slice(0, 10)} – {r.end_date.slice(0, 10)}</span>
          {r.notes && <span className="text-gray-500">{r.notes}</span>}
          <button onClick={() => delMut.mutate(r.id)} className="text-red-400 hover:text-red-600 mr-auto">×</button>
        </div>
      ))}
      <div className="flex gap-1 items-end flex-wrap border-t border-gray-100 pt-1">
        <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
          className="border rounded px-1 py-0.5 text-xs" />
        <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
          className="border rounded px-1 py-0.5 text-xs" />
        <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          className="border rounded px-1 py-0.5 text-xs flex-1" placeholder="הערות" />
        <button onClick={() => addMut.mutate(form)} className="bg-primary text-white rounded px-2 py-0.5 text-xs hover:bg-primary-dark">+ הוסף</button>
      </div>
    </div>
  );
}

export default function StaffPage() {
  const qc = useQueryClient();
  const { data: staffList = [] } = useQuery({ queryKey: ['staff'], queryFn: getStaff });
  const addMut = useMutation({ mutationFn: createStaff, onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }) });
  const updMut = useMutation({ mutationFn: ({ id, ...b }: Partial<Staff> & { id: string }) => updateStaff(id, b), onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }) });
  const delMut = useMutation({ mutationFn: deleteStaff, onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }) });

  const [expanded, setExpanded] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'avail' | 'absences'>('avail');
  const [addForm, setAddForm] = useState({ name: '', status: 'ליבה' as StaffStatus });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; status: StaffStatus }>({ name: '', status: 'ליבה' });

  return (
    <div>
      <div className="bg-primary text-white text-center py-8 px-4">
        <h1 className="text-3xl font-bold">רשימת חברי סגל</h1>
      </div>
      <GeometricPattern />

      <div className="p-6 max-w-4xl mx-auto space-y-3">
        {/* Add form */}
        <div className="bg-white border border-gray-200 rounded p-3 flex gap-2 items-end">
          <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
            className="border rounded px-2 py-1 text-sm flex-1" placeholder="שם חבר הסגל" />
          <select value={addForm.status} onChange={e => setAddForm(f => ({ ...f, status: e.target.value as StaffStatus }))}
            className="border rounded px-2 py-1 text-sm">
            {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
          </select>
          <button
            onClick={() => { addMut.mutate(addForm); setAddForm({ name: '', status: 'ליבה' }); }}
            className="bg-primary text-white rounded px-3 py-1 text-sm hover:bg-primary-dark"
          >+ הוסף</button>
        </div>

        {/* Staff list */}
        {staffList.map(s => (
          <div key={s.id} className="bg-white border border-gray-200 rounded overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              {editId === s.id ? (
                <>
                  <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="border rounded px-2 py-0.5 text-sm flex-1" />
                  <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as StaffStatus }))}
                    className="border rounded px-2 py-0.5 text-sm">
                    {STATUS_OPTS.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <button onClick={() => { updMut.mutate({ id: s.id, ...editForm }); setEditId(null); }} className="text-green-600 text-sm hover:text-green-700">שמור</button>
                  <button onClick={() => setEditId(null)} className="text-gray-400 text-sm">ביטול</button>
                </>
              ) : (
                <>
                  <span className="font-medium flex-1">{s.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${STATUS_BADGE[s.status]}`}>{s.status}</span>
                  <button onClick={() => { setEditId(s.id); setEditForm({ name: s.name, status: s.status }); }} className="text-primary text-xs hover:underline">עריכה</button>
                  <button onClick={() => setExpanded(expanded === s.id ? null : s.id)} className="text-xs text-gray-500 hover:text-gray-700 border rounded px-2 py-0.5">
                    {expanded === s.id ? '▴ סגור' : '▾ זמינות'}
                  </button>
                  <button onClick={() => delMut.mutate(s.id)} className="text-red-400 text-xs hover:text-red-600">מחק</button>
                </>
              )}
            </div>

            {expanded === s.id && (
              <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
                <div className="flex gap-3 mb-2">
                  <button onClick={() => setSubTab('avail')} className={`text-xs px-2 py-0.5 rounded border ${subTab === 'avail' ? 'bg-primary text-white border-primary' : 'border-gray-200'}`}>זמינות קבועה</button>
                  <button onClick={() => setSubTab('absences')} className={`text-xs px-2 py-0.5 rounded border ${subTab === 'absences' ? 'bg-primary text-white border-primary' : 'border-gray-200'}`}>היעדרויות חד-פעמיות</button>
                </div>
                {subTab === 'avail' && <AvailabilityPanel staff={s} />}
                {subTab === 'absences' && <AbsencesPanel staff={s} />}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
