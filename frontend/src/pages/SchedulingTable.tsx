import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSessions, createSession, updateSession, deleteSession } from '../api/sessions';
import { getCourses } from '../api/courses';
import { getStaff } from '../api/staff';
import { getCalendarTypes } from '../api/lookups';
import type { Session, Staff } from '../api/types';
import GeometricPattern from '../components/layout/GeometricPattern';
import LookupSelect from '../components/ui/LookupSelect';
import MultiLookupSelect from '../components/ui/MultiLookupSelect';
import { CalendarTag, StatusTagBlock } from '../components/ui/StatusTag';
import { format } from 'date-fns';

// ─── Inline cell editors ─────────────────────────────────────────────────────

function InlineDateCell({
  value,
  onSave,
  onCancel,
}: {
  value: string;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState(value ? value.slice(0, 16) : '');
  return (
    <input
      type="datetime-local"
      autoFocus
      value={v}
      onChange={e => setV(e.target.value)}
      onBlur={() => onSave(v)}
      onKeyDown={e => {
        if (e.key === 'Enter') onSave(v);
        if (e.key === 'Escape') onCancel();
      }}
      className="border border-primary rounded px-1 py-0.5 text-xs w-44 outline-none focus:ring-1 focus:ring-primary"
    />
  );
}

// ─── Row component with inline editing ───────────────────────────────────────

interface RowProps {
  session: Session;
  courses: { id: string; name: string }[];
  staffList: Staff[];
  calTypes: { id: string; name: string }[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Record<string, unknown>) => void;
}

type EditingCell = 'course' | 'start' | 'end' | 'staff' | 'calendar' | null;

function SessionRow({ session, courses, staffList, calTypes, onDelete, onUpdate }: RowProps) {
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [showAvail, setShowAvail] = useState(false);
  const [showCore, setShowCore] = useState(false);
  const [showConflict, setShowConflict] = useState(false);

  function save(patch: Record<string, unknown>) {
    onUpdate(session.id, patch);
    setEditingCell(null);
  }

  function CellWrapper({ col, children, display }: { col: EditingCell; children: React.ReactNode; display: React.ReactNode }) {
    if (editingCell === col) return <td className="px-2 py-1.5 align-top">{children}</td>;
    return (
      <td
        className="px-2 py-1.5 align-top cursor-pointer hover:bg-primary/5 group"
        onClick={() => setEditingCell(col)}
        title="לחץ לעריכה"
      >
        <div className="min-h-[22px]">{display}</div>
      </td>
    );
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/60 text-sm">
      {/* Course */}
      <CellWrapper
        col="course"
        display={
          <span className="text-wrap-cell max-w-[180px] block font-medium text-gray-800">
            {session.course?.name ?? <span className="text-gray-300">—</span>}
          </span>
        }
      >
        <LookupSelect
          options={courses}
          value={session.course?.id ?? null}
          onChange={v => {
            const course = courses.find(c => c.id === v);
            save({ course_id: v, ...(course ? {} : {}) });
          }}
          className="w-48"
        />
      </CellWrapper>

      {/* Start datetime */}
      <CellWrapper
        col="start"
        display={
          <span className="whitespace-nowrap text-xs text-gray-700">
            {format(new Date(session.start_datetime), 'dd/MM/yyyy, HH:mm')}
          </span>
        }
      >
        <InlineDateCell
          value={session.start_datetime}
          onSave={v => save({ start_datetime: v, end_datetime: session.end_datetime })}
          onCancel={() => setEditingCell(null)}
        />
      </CellWrapper>

      {/* End datetime */}
      <CellWrapper
        col="end"
        display={
          <span className="whitespace-nowrap text-xs text-gray-700">
            {format(new Date(session.end_datetime), 'dd/MM/yyyy, HH:mm')}
          </span>
        }
      >
        <InlineDateCell
          value={session.end_datetime}
          onSave={v => save({ start_datetime: session.start_datetime, end_datetime: v })}
          onCancel={() => setEditingCell(null)}
        />
      </CellWrapper>

      {/* Staff */}
      <CellWrapper
        col="staff"
        display={
          <div className="flex flex-wrap gap-1">
            {session.staff.length === 0
              ? <span className="text-gray-300 text-xs">—</span>
              : session.staff.map(s => (
                <span key={s.id} className="text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5">{s.name}</span>
              ))}
          </div>
        }
      >
        <MultiLookupSelect
          options={staffList}
          value={session.staff.map(s => s.id)}
          onChange={ids => save({ staff_ids: ids, course_id: session.course?.id ?? null, start_datetime: session.start_datetime, end_datetime: session.end_datetime })}
          className="w-56"
        />
      </CellWrapper>

      {/* Calendar type */}
      <CellWrapper
        col="calendar"
        display={
          session.calendar_type
            ? <CalendarTag name={session.calendar_type.name} />
            : <span className="text-gray-300 text-xs">—</span>
        }
      >
        <LookupSelect
          options={calTypes}
          value={session.calendar_type?.id ?? null}
          onChange={v => save({ calendar_type_id: v, course_id: session.course?.id ?? null, start_datetime: session.start_datetime, end_datetime: session.end_datetime })}
          className="w-48"
        />
      </CellWrapper>

      {/* Assignment day (computed, read-only) */}
      <td className="px-2 py-1.5 text-xs text-gray-500 whitespace-nowrap align-top">
        {session.assignment_day}
      </td>

      {/* Staff availability (assigned, computed) */}
      <td className="px-2 py-1.5 align-top">
        {session.staff_availability ? (
          <div>
            <div className="availability-cell text-xs max-w-[240px]">
              {showAvail
                ? <StatusTagBlock text={session.staff_availability} />
                : <StatusTagBlock text={session.staff_availability.split('\n').slice(0, 2).join('\n')} />
              }
            </div>
            {session.staff_availability.split('\n').length > 2 && (
              <button onClick={e => { e.stopPropagation(); setShowAvail(v => !v); }} className="text-xs text-primary hover:underline mt-0.5">
                {showAvail ? '▴ פחות' : '▾ עוד'}
              </button>
            )}
          </div>
        ) : <span className="text-gray-300 text-xs">—</span>}
      </td>

      {/* All core staff availability */}
      <td className="px-2 py-1.5 align-top">
        {session.all_core_availability ? (
          <div>
            <div className="availability-cell text-xs max-w-[240px]">
              {showCore
                ? <StatusTagBlock text={session.all_core_availability} />
                : <StatusTagBlock text={session.all_core_availability.split('\n').slice(0, 2).join('\n')} />
              }
            </div>
            {session.all_core_availability.split('\n').length > 2 && (
              <button onClick={e => { e.stopPropagation(); setShowCore(v => !v); }} className="text-xs text-primary hover:underline mt-0.5">
                {showCore ? '▴ פחות' : '▾ עוד'}
              </button>
            )}
          </div>
        ) : <span className="text-gray-300 text-xs">—</span>}
      </td>

      {/* Concurrent sessions */}
      <td className="px-2 py-1.5 align-top">
        <div>
          <div className="availability-cell text-xs max-w-[220px]">
            {showConflict
              ? <StatusTagBlock text={session.concurrent_sessions} />
              : <StatusTagBlock text={session.concurrent_sessions.split('\n').slice(0, 2).join('\n')} />
            }
          </div>
          {session.concurrent_sessions.split('\n').length > 2 && (
            <button onClick={e => { e.stopPropagation(); setShowConflict(v => !v); }} className="text-xs text-primary hover:underline mt-0.5">
              {showConflict ? '▴ פחות' : '▾ עוד'}
            </button>
          )}
        </div>
      </td>

      {/* Delete */}
      <td className="px-2 py-1.5 align-top">
        <button onClick={() => onDelete(session.id)} className="text-red-300 hover:text-red-500 text-xs">
          🗑
        </button>
      </td>
    </tr>
  );
}

// ─── New session row ──────────────────────────────────────────────────────────

function NewSessionRow({
  courses,
  staffList,
  calTypes,
  onAdd,
}: {
  courses: { id: string; name: string }[];
  staffList: Staff[];
  calTypes: { id: string; name: string }[];
  onAdd: (s: object) => void;
}) {
  const [form, setForm] = useState({
    course_id: null as string | null,
    start_datetime: '',
    end_datetime: '',
    staff_ids: [] as string[],
    calendar_type_id: null as string | null,
  });

  function handleAdd() {
    if (!form.start_datetime || !form.end_datetime) return;
    onAdd(form);
    setForm({ course_id: null, start_datetime: '', end_datetime: '', staff_ids: [], calendar_type_id: null });
  }

  return (
    <tr className="border-b border-dashed border-gray-200 bg-cream/50">
      <td className="px-2 py-1.5">
        <LookupSelect options={courses} value={form.course_id} onChange={v => setForm(f => ({ ...f, course_id: v }))} placeholder="בחר קורס" className="w-44" />
      </td>
      <td className="px-2 py-1.5">
        <input type="datetime-local" value={form.start_datetime} onChange={e => setForm(f => ({ ...f, start_datetime: e.target.value }))}
          className="border rounded px-1 py-0.5 text-xs w-44" />
      </td>
      <td className="px-2 py-1.5">
        <input type="datetime-local" value={form.end_datetime} onChange={e => setForm(f => ({ ...f, end_datetime: e.target.value }))}
          className="border rounded px-1 py-0.5 text-xs w-44" />
      </td>
      <td className="px-2 py-1.5">
        <MultiLookupSelect options={staffList} value={form.staff_ids} onChange={ids => setForm(f => ({ ...f, staff_ids: ids }))} placeholder="חברי סגל" className="w-52" />
      </td>
      <td className="px-2 py-1.5">
        <LookupSelect options={calTypes} value={form.calendar_type_id} onChange={v => setForm(f => ({ ...f, calendar_type_id: v }))} placeholder="שיוך יומן" className="w-44" />
      </td>
      <td colSpan={5} />
      <td className="px-2 py-1.5">
        <button onClick={handleAdd} className="bg-primary text-white rounded px-2 py-0.5 text-xs hover:bg-primary-dark whitespace-nowrap">
          + הוסף
        </button>
      </td>
    </tr>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SchedulingTable() {
  const qc = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({ queryKey: ['sessions'], queryFn: () => getSessions() });
  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: getCourses });
  const { data: staffList = [] } = useQuery({ queryKey: ['staff'], queryFn: getStaff });
  const { data: calTypes = [] } = useQuery({ queryKey: ['calendar-types'], queryFn: getCalendarTypes });

  const addMut = useMutation({
    mutationFn: createSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });

  type UpdatePayload = { id: string; course_id?: string | null; start_datetime?: string; end_datetime?: string; calendar_type_id?: string | null; staff_ids?: string[]; [key: string]: unknown };
  const updMut = useMutation({
    mutationFn: ({ id, ...body }: UpdatePayload) => updateSession(id, body as any),
    // Optimistic update
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: ['sessions'] });
      const prev = qc.getQueryData<Session[]>(['sessions']);
      qc.setQueryData<Session[]>(['sessions'], old =>
        old?.map(s => s.id === id ? { ...s, ...patch } : s) ?? []
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['sessions'], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });

  const delMut = useMutation({
    mutationFn: deleteSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });

  const handleUpdate = useCallback((id: string, patch: Record<string, unknown>) => {
    const session = sessions.find(s => s.id === id);
    if (!session) return;
    updMut.mutate({
      id,
      course_id: session.course?.id ?? null,
      start_datetime: session.start_datetime,
      end_datetime: session.end_datetime,
      calendar_type_id: session.calendar_type?.id ?? null,
      staff_ids: session.staff.map(s => s.id),
      ...patch,
    });
  }, [sessions, updMut]);

  const courseOptions = courses.map(c => ({ id: c.id, name: c.name }));

  const HEADERS = [
    'תהליך למידה / קורס',
    'תאריך ושעת התחלה',
    'תאריך ושעת סיום',
    'חברי סגל אחראים',
    'שיוך יומן',
    'יום השיבוץ',
    'האם חברי הסגל פנויים?',
    'בדיקת זמינות (כל הסגל)',
    'מה קורה בשעה זאת?',
    '',
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-primary text-white text-center py-10 px-4">
        <h1 className="text-4xl font-bold">יומן מתכלל</h1>
      </div>
      <GeometricPattern />

      <div className="p-4">
        {isLoading && <p className="text-gray-400 text-sm p-4">טוען...</p>}

        <div className="overflow-x-auto bg-white rounded border border-gray-200">
          <table className="text-sm min-w-max w-full">
            <thead>
              <tr className="bg-cream border-b border-gray-200">
                {HEADERS.map((h, i) => (
                  <th key={i} className="px-2 py-2 text-right font-medium text-gray-600 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <NewSessionRow
                courses={courseOptions}
                staffList={staffList}
                calTypes={calTypes}
                onAdd={form => addMut.mutate(form as any)}
              />
              {sessions.map(s => (
                <SessionRow
                  key={s.id}
                  session={s}
                  courses={courseOptions}
                  staffList={staffList}
                  calTypes={calTypes}
                  onDelete={id => delMut.mutate(id)}
                  onUpdate={handleUpdate}
                />
              ))}
              {!isLoading && sessions.length === 0 && (
                <tr>
                  <td colSpan={HEADERS.length} className="px-3 py-6 text-center text-gray-400">
                    אין שיבוצים. הוסף שיבוץ חדש בשורה הראשונה.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          לחץ על כל תא לעריכה מהירה. שינויים נשמרים אוטומטית.
        </p>
      </div>
    </div>
  );
}
