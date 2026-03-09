import request from './client';
import type { Session } from './types';

export const getSessions = (params?: { calendar_type_id?: string; start?: string; end?: string }) => {
  const q = new URLSearchParams();
  if (params?.calendar_type_id) q.set('calendar_type_id', params.calendar_type_id);
  if (params?.start) q.set('start', params.start);
  if (params?.end) q.set('end', params.end);
  return request<Session[]>(`/sessions?${q}`);
};

export const getSession = (id: string) => request<Session>(`/sessions/${id}`);

export const createSession = (body: Partial<Session> & { staff_ids?: string[] }) =>
  request<Session>('/sessions', { method: 'POST', body: JSON.stringify(body) });

export const updateSession = (id: string, body: Partial<Session> & { staff_ids?: string[] }) =>
  request<Session>(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const deleteSession = (id: string) =>
  request<void>(`/sessions/${id}`, { method: 'DELETE' });
