import request from './client';
import type { Course } from './types';

export const getCourses = () => request<Course[]>('/courses');
export const createCourse = (body: Partial<Course> & { staff_ids?: string[] }) =>
  request<Course>('/courses', { method: 'POST', body: JSON.stringify(body) });
export const updateCourse = (id: string, body: Partial<Course> & { staff_ids?: string[] }) =>
  request<Course>(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteCourse = (id: string) =>
  request<void>(`/courses/${id}`, { method: 'DELETE' });
