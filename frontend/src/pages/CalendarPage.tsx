import { useState } from 'react';
import { useParams } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useQuery } from '@tanstack/react-query';
import { getSessions } from '../api/sessions';
import { getCalendarTypes } from '../api/lookups';
import GeometricPattern from '../components/layout/GeometricPattern';
import { CalendarTag } from '../components/ui/StatusTag';
import { format } from 'date-fns';

const EVENT_COLORS: Record<string, string> = {
  'שנה א':                    '#1D5E4E',
  'שנה ב':                    '#2563eb',
  'מיון':                     '#7c3aed',
  'דמוקרטיה':                 '#d97706',
  'זמנים בית ספריים':         '#16a34a',
  'זמנים קרן מנדל':           '#059669',
  'חופשות':                   '#9ca3af',
  'המרכז למדיניות בחינוך':    '#4f46e5',
};

export default function CalendarPage() {
  const { calendarTypeId } = useParams<{ calendarTypeId?: string }>();
  const [view, setView] = useState<'calendar' | 'table'>('calendar');

  const { data: calTypes } = useQuery({ queryKey: ['calendar-types'], queryFn: getCalendarTypes });
  const calType = calTypes?.find(c => c.id === calendarTypeId);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions', calendarTypeId],
    queryFn: () => getSessions(calendarTypeId ? { calendar_type_id: calendarTypeId } : undefined),
  });

  const events = sessions.map(s => ({
    id: s.id,
    title: s.course?.name ?? '(ללא קורס)',
    start: s.start_datetime,
    end: s.end_datetime,
    backgroundColor: EVENT_COLORS[s.calendar_type?.name ?? ''] ?? '#1D5E4E',
    borderColor: 'transparent',
    extendedProps: { session: s },
  }));

  const title = calType?.name ?? 'יומן מתכלל';

  return (
    <div>
      {/* Header banner */}
      <div className="bg-primary text-white text-center py-10 px-4">
        <h1 className="text-4xl font-bold">יומן {title}</h1>
      </div>
      <GeometricPattern />

      <div className="p-6">
        {/* Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm border transition-colors ${view === 'calendar' ? 'border-primary bg-primary text-white' : 'border-gray-200 hover:border-primary'}`}
          >
            📅 לוח שנה
          </button>
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm border transition-colors ${view === 'table' ? 'border-primary bg-primary text-white' : 'border-gray-200 hover:border-primary'}`}
          >
            ⊞ טבלה
          </button>
        </div>

        {isLoading && <p className="text-gray-400 text-sm">טוען...</p>}

        {!isLoading && view === 'calendar' && (
          <div className="bg-white rounded border border-gray-200 p-3">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={events}
              locale="he"
              direction="rtl"
              headerToolbar={{ start: 'prev,next today', center: 'title', end: '' }}
              buttonText={{ today: 'היום', month: 'חודש', week: 'שבוע' }}
              height="auto"
              eventContent={arg => (
                <div className="text-xs px-1 truncate" title={arg.event.title}>
                  {arg.event.title}
                </div>
              )}
            />
          </div>
        )}

        {!isLoading && view === 'table' && (
          <div className="overflow-x-auto bg-white rounded border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-cream">
                  <th className="px-3 py-2 text-right font-medium text-gray-600">תאריך התחלה</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">תאריך סיום</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">תהליך למידה / קורס</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">חברי סגל</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">שיוך יומן</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">יום</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={s.id} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {format(new Date(s.start_datetime), 'dd/MM/yyyy, HH:mm')}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {format(new Date(s.end_datetime), 'dd/MM/yyyy, HH:mm')}
                    </td>
                    <td className="px-3 py-2 text-wrap-cell max-w-[220px]">
                      {s.course?.name ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {s.staff.map(st => (
                          <span key={st.id} className="text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5">
                            {st.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {s.calendar_type && <CalendarTag name={s.calendar_type.name} />}
                    </td>
                    <td className="px-3 py-2 text-gray-500">{s.assignment_day}</td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-4 text-center text-gray-400">אין שיבוצים</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
