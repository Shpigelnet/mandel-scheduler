import request from './client';
import type { CalendarType, KnowledgeArea, MeetingType, SuperTopic } from './types';

export const getCalendarTypes = () => request<CalendarType[]>('/lookups/calendar-types');
export const getKnowledgeAreas = () => request<KnowledgeArea[]>('/lookups/knowledge-areas');
export const getMeetingTypes = () => request<MeetingType[]>('/lookups/meeting-types');
export const getSuperTopics = () => request<SuperTopic[]>('/lookups/super-topics');
