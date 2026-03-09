import request from './client';
import type { Staff, RegularAvailability, Absence } from './types';

export const getStaff = () => request<Staff[]>('/staff');
export const createStaff = (body: Partial<Staff>) =>
  request<Staff>('/staff', { method: 'POST', body: JSON.stringify(body) });
export const updateStaff = (id: string, body: Partial<Staff>) =>
  request<Staff>(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteStaff = (id: string) =>
  request<void>(`/staff/${id}`, { method: 'DELETE' });

export const getAvailability = (staffId: string) =>
  request<RegularAvailability[]>(`/staff/${staffId}/availability`);
export const createAvailability = (staffId: string, body: Partial<RegularAvailability>) =>
  request<RegularAvailability>(`/staff/${staffId}/availability`, { method: 'POST', body: JSON.stringify(body) });
export const updateAvailability = (staffId: string, avid: string, body: Partial<RegularAvailability>) =>
  request<RegularAvailability>(`/staff/${staffId}/availability/${avid}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteAvailability = (staffId: string, avid: string) =>
  request<void>(`/staff/${staffId}/availability/${avid}`, { method: 'DELETE' });

export const getAbsences = (staffId: string) =>
  request<Absence[]>(`/staff/${staffId}/absences`);
export const createAbsence = (staffId: string, body: Partial<Absence>) =>
  request<Absence>(`/staff/${staffId}/absences`, { method: 'POST', body: JSON.stringify(body) });
export const updateAbsence = (staffId: string, aid: string, body: Partial<Absence>) =>
  request<Absence>(`/staff/${staffId}/absences/${aid}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteAbsence = (staffId: string, aid: string) =>
  request<void>(`/staff/${staffId}/absences/${aid}`, { method: 'DELETE' });
