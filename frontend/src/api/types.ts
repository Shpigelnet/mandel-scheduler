export type StaffStatus = 'אורח' | 'ספק' | 'סגל קרן מנדל' | 'ליבה';
export type DayOfWeek = 'יום א' | 'יום ב' | 'יום ג' | 'יום ד' | 'יום ה';
export type AvailabilityType = 'זמינות מלאה' | 'זמין בתיאום מראש' | 'לא זמין';

export interface Staff {
  id: string;
  name: string;
  status: StaffStatus;
}

export interface RegularAvailability {
  id: string;
  staff_id: string;
  day_of_week: DayOfWeek;
  availability: AvailabilityType;
  time_start: string | null;
  time_end: string | null;
  notes: string | null;
}

export interface Absence {
  id: string;
  staff_id: string;
  start_date: string;
  end_date: string;
  notes: string | null;
}

export interface CalendarType {
  id: string;
  name: string;
}

export interface KnowledgeArea {
  id: string;
  name: string;
}

export interface MeetingType {
  id: string;
  name: string;
}

export interface SuperTopic {
  id: string;
  name: string;
}

export interface Course {
  id: string;
  name: string;
  calendar_type_id: string | null;
  calendar_type_name: string | null;
  knowledge_area_id: string | null;
  knowledge_area_name: string | null;
  meeting_type_id: string | null;
  meeting_type_name: string | null;
  super_topic_id: string | null;
  super_topic_name: string | null;
  combined_super_topic_id: string | null;
  combined_super_topic_name: string | null;
  staff: Staff[];
}

export interface Session {
  id: string;
  notes: string | null;
  start_datetime: string;
  end_datetime: string;
  course: { id: string; name: string } | null;
  calendar_type: { id: string; name: string } | null;
  staff: Staff[];
  // computed
  assignment_day: string;
  staff_availability: string;
  all_core_availability: string;
  concurrent_sessions: string;
}
