CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE staff_status AS ENUM ('אורח', 'ספק', 'סגל קרן מנדל', 'ליבה');
CREATE TYPE day_of_week_he AS ENUM ('יום א', 'יום ב', 'יום ג', 'יום ד', 'יום ה');
CREATE TYPE availability_type AS ENUM ('זמינות מלאה', 'זמין בתיאום מראש', 'לא זמין');

CREATE TABLE staff (
  id     uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name   text NOT NULL,
  status staff_status NOT NULL
);

CREATE TABLE regular_availability (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id     uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  day_of_week  day_of_week_he NOT NULL,
  availability availability_type NOT NULL,
  time_start   time,
  time_end     time,
  notes        text
);
CREATE INDEX idx_reg_avail_staff_day ON regular_availability(staff_id, day_of_week);

CREATE TABLE one_time_absences (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id   uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  start_date timestamptz NOT NULL,
  end_date   timestamptz NOT NULL,
  notes      text
);
CREATE INDEX idx_absences_staff ON one_time_absences(staff_id);

CREATE TABLE calendar_types (
  id   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL
);

CREATE TABLE knowledge_areas (
  id   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL
);

CREATE TABLE meeting_types (
  id   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL
);

CREATE TABLE super_topics (
  id   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL
);

CREATE TABLE combined_super_topics (
  id   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL
);

CREATE TABLE courses (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    text NOT NULL,
  calendar_type_id        uuid REFERENCES calendar_types(id),
  knowledge_area_id       uuid REFERENCES knowledge_areas(id),
  meeting_type_id         uuid REFERENCES meeting_types(id),
  super_topic_id          uuid REFERENCES super_topics(id),
  combined_super_topic_id uuid REFERENCES combined_super_topics(id)
);

CREATE TABLE course_staff (
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  staff_id  uuid NOT NULL REFERENCES staff(id)   ON DELETE CASCADE,
  PRIMARY KEY (course_id, staff_id)
);

CREATE TABLE sessions (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id        uuid REFERENCES courses(id),
  start_datetime   timestamptz NOT NULL,
  end_datetime     timestamptz NOT NULL,
  calendar_type_id uuid REFERENCES calendar_types(id),
  notes            text
);
CREATE INDEX idx_sessions_time ON sessions(start_datetime, end_datetime);

CREATE TABLE session_staff (
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  staff_id   uuid NOT NULL REFERENCES staff(id)    ON DELETE CASCADE,
  PRIMARY KEY (session_id, staff_id)
);
