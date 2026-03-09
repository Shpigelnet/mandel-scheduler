import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../api/courses';
import { getStaff } from '../api/staff';
import { getCalendarTypes, getKnowledgeAreas, getMeetingTypes, getSuperTopics } from '../api/lookups';
import type { Course } from '../api/types';
import GeometricPattern from '../components/layout/GeometricPattern';
import LookupSelect from '../components/ui/LookupSelect';
import MultiLookupSelect from '../components/ui/MultiLookupSelect';

type CourseForm = {
  name: string;
  calendar_type_id: string | null;
  knowledge_area_id: string | null;
  meeting_type_id: string | null;
  super_topic_id: string | null;
  staff_ids: string[];
};

const emptyForm = (): CourseForm => ({
  name: '', calendar_type_id: null, knowledge_area_id: null,
  meeting_type_id: null, super_topic_id: null, staff_ids: [],
});

export default function CoursesPage() {
  const qc = useQueryClient();
  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: getCourses });
  const { data: staffList = [] } = useQuery({ queryKey: ['staff'], queryFn: getStaff });
  const { data: calTypes = [] } = useQuery({ queryKey: ['calendar-types'], queryFn: getCalendarTypes });
  const { data: kaList = [] } = useQuery({ queryKey: ['knowledge-areas'], queryFn: getKnowledgeAreas });
  const { data: mtList = [] } = useQuery({ queryKey: ['meeting-types'], queryFn: getMeetingTypes });
  const { data: stList = [] } = useQuery({ queryKey: ['super-topics'], queryFn: getSuperTopics });

  const addMut = useMutation({ mutationFn: createCourse, onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }) });
  const updMut = useMutation({ mutationFn: ({ id, ...b }: CourseForm & { id: string }) => updateCourse(id, b), onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }) });
  const delMut = useMutation({ mutationFn: deleteCourse, onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }) });

  const [addForm, setAddForm] = useState<CourseForm>(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CourseForm>(emptyForm());

  function startEdit(c: Course) {
    setEditId(c.id);
    setEditForm({
      name: c.name,
      calendar_type_id: c.calendar_type_id,
      knowledge_area_id: c.knowledge_area_id,
      meeting_type_id: c.meeting_type_id,
      super_topic_id: c.super_topic_id,
      staff_ids: c.staff.map(s => s.id),
    });
  }

  return (
    <div>
      <div className="bg-primary text-white text-center py-8 px-4">
        <h1 className="text-3xl font-bold">רשימת קורסים</h1>
      </div>
      <GeometricPattern />

      <div className="p-6 max-w-5xl mx-auto space-y-4">
        {/* Add form */}
        <div className="bg-white border border-gray-200 rounded p-4 space-y-2">
          <h3 className="text-sm font-medium text-primary">הוספת קורס חדש</h3>
          <div className="grid grid-cols-2 gap-2">
            <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
              className="border rounded px-2 py-1 text-sm col-span-2" placeholder="שם הקורס" />
            <LookupSelect options={calTypes} value={addForm.calendar_type_id} onChange={v => setAddForm(f => ({ ...f, calendar_type_id: v }))} placeholder="שיוך יומן" />
            <LookupSelect options={kaList} value={addForm.knowledge_area_id} onChange={v => setAddForm(f => ({ ...f, knowledge_area_id: v }))} placeholder="תחום דעת" />
            <LookupSelect options={mtList} value={addForm.meeting_type_id} onChange={v => setAddForm(f => ({ ...f, meeting_type_id: v }))} placeholder="סוג מפגש" />
            <LookupSelect options={stList} value={addForm.super_topic_id} onChange={v => setAddForm(f => ({ ...f, super_topic_id: v }))} placeholder="נושא על" />
            <div className="col-span-2">
              <MultiLookupSelect options={staffList} value={addForm.staff_ids} onChange={ids => setAddForm(f => ({ ...f, staff_ids: ids }))} placeholder="חברי סגל – הוראה" />
            </div>
          </div>
          <button onClick={() => { addMut.mutate(addForm); setAddForm(emptyForm()); }}
            className="bg-primary text-white rounded px-3 py-1 text-sm hover:bg-primary-dark">+ הוסף קורס</button>
        </div>

        {/* Courses table */}
        <div className="bg-white border border-gray-200 rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-cream text-gray-600">
                <th className="text-right px-3 py-2 font-medium">שם הקורס</th>
                <th className="text-right px-3 py-2 font-medium">שיוך יומן</th>
                <th className="text-right px-3 py-2 font-medium">תחום דעת</th>
                <th className="text-right px-3 py-2 font-medium">חברי סגל</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c, i) => (
                <tr key={c.id} className={`border-b border-gray-50 ${i % 2 ? 'bg-gray-50/50' : ''}`}>
                  {editId === c.id ? (
                    <td colSpan={5} className="px-3 py-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                          className="border rounded px-2 py-1 text-sm col-span-2" />
                        <LookupSelect options={calTypes} value={editForm.calendar_type_id} onChange={v => setEditForm(f => ({ ...f, calendar_type_id: v }))} placeholder="שיוך יומן" />
                        <LookupSelect options={kaList} value={editForm.knowledge_area_id} onChange={v => setEditForm(f => ({ ...f, knowledge_area_id: v }))} placeholder="תחום דעת" />
                        <div className="col-span-2">
                          <MultiLookupSelect options={staffList} value={editForm.staff_ids} onChange={ids => setEditForm(f => ({ ...f, staff_ids: ids }))} placeholder="חברי סגל" />
                        </div>
                        <div className="flex gap-2 col-span-2">
                          <button onClick={() => { updMut.mutate({ id: c.id, ...editForm }); setEditId(null); }} className="bg-primary text-white rounded px-2 py-0.5 text-xs">שמור</button>
                          <button onClick={() => setEditId(null)} className="border rounded px-2 py-0.5 text-xs">ביטול</button>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="px-3 py-2 text-wrap-cell max-w-[220px] font-medium">{c.name}</td>
                      <td className="px-3 py-2 text-gray-500">{c.calendar_type_name ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-500">{c.knowledge_area_name ?? '—'}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {c.staff.map(st => (
                            <span key={st.id} className="text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5">{st.name}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button onClick={() => startEdit(c)} className="text-primary text-xs hover:underline ml-2">עריכה</button>
                        <button onClick={() => delMut.mutate(c.id)} className="text-red-400 text-xs hover:text-red-600">מחק</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
