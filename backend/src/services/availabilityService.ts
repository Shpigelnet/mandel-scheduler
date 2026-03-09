import { Pool } from 'pg';

// ─── Types ────────────────────────────────────────────────────────────────────

type HebrewDay = 'יום א' | 'יום ב' | 'יום ג' | 'יום ד' | 'יום ה' | 'יום ו' | 'שבת' | '—';

interface StaffRow {
  id: string;
  name: string;
  status: 'אורח' | 'ספק' | 'סגל קרן מנדל' | 'ליבה';
}

interface RegAvailRow {
  id: string;
  staff_id: string;
  day_of_week: HebrewDay;
  availability: 'זמינות מלאה' | 'זמין בתיאום מראש' | 'לא זמין';
  time_start: string | null;
  time_end: string | null;
  notes: string | null;
}

interface AbsenceRow {
  id: string;
  staff_id: string;
  start_date: Date;
  end_date: Date;
  notes: string | null;
}

// ─── 27-hour weekday rule ─────────────────────────────────────────────────────
// Mirrors Coda: Weekday(date - Hours(27))
// A session at 01:00 belongs to the PREVIOUS calendar day.
export function getHebrewWeekday(startDatetime: Date): HebrewDay {
  const shifted = new Date(startDatetime.getTime() - 27 * 60 * 60 * 1000);
  const wd = shifted.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const map: Record<number, HebrewDay> = {
    0: 'יום א',
    1: 'יום ב',
    2: 'יום ג',
    3: 'יום ד',
    4: 'יום ה',
    5: 'יום ו',
    6: 'שבת',
  };
  return map[wd] ?? '—';
}

// ─── Time overlap helper ──────────────────────────────────────────────────────
// Returns true if HH:MM time ranges [a1,a2) and [b1,b2) overlap.
function timesOverlap(a1: string, a2: string, b1: string, b2: string): boolean {
  return a1 < b2 && a2 > b1;
}

function toTimeStr(dt: Date): string {
  const h = String(dt.getHours()).padStart(2, '0');
  const m = String(dt.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatDate(dt: Date): string {
  return dt.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Function 2: check assigned staff availability ───────────────────────────
export async function checkAssignedStaffAvailability(
  sessionId: string,
  db: Pool
): Promise<string> {
  // Fetch the session
  const sessionRes = await db.query<{
    start_datetime: Date;
    end_datetime: Date;
    calendar_type_name: string | null;
  }>(
    `SELECT s.start_datetime, s.end_datetime, ct.name AS calendar_type_name
     FROM sessions s
     LEFT JOIN calendar_types ct ON ct.id = s.calendar_type_id
     WHERE s.id = $1`,
    [sessionId]
  );
  if (!sessionRes.rows[0]) return '';
  const { start_datetime, end_datetime } = sessionRes.rows[0];

  // Fetch assigned staff
  const staffRes = await db.query<StaffRow>(
    `SELECT st.id, st.name, st.status
     FROM session_staff ss
     JOIN staff st ON st.id = ss.staff_id
     WHERE ss.session_id = $1
     ORDER BY st.name`,
    [sessionId]
  );

  const weekday = getHebrewWeekday(start_datetime);
  const slotStartTime = toTimeStr(start_datetime);
  const slotEndTime = toTimeStr(end_datetime);

  const lines: string[] = [];

  for (const member of staffRes.rows) {
    // 1. External staff
    if (member.status === 'ספק' || member.status === 'אורח') {
      lines.push(`🟠 ${member.name} - חבר סגל חיצוני - צריך לבדוק זמינות!`);
      continue;
    }

    // 2. Double-booking count
    const dblRes = await db.query<{ cnt: string }>(
      `SELECT COUNT(*) AS cnt
       FROM sessions s
       JOIN session_staff ss ON ss.session_id = s.id
       WHERE ss.staff_id = $1
         AND s.id != $2
         AND s.start_datetime < $3
         AND s.end_datetime   > $4`,
      [member.id, sessionId, end_datetime, start_datetime]
    );
    const doubleCount = parseInt(dblRes.rows[0]?.cnt ?? '0', 10);
    const doubleSuffix = doubleCount > 0 ? ' + 🔴 דאבל בוקינג' : '';

    // 3. One-time absence
    const absRes = await db.query<AbsenceRow>(
      `SELECT * FROM one_time_absences
       WHERE staff_id = $1
         AND start_date < $2
         AND end_date   > $3`,
      [member.id, end_datetime, start_datetime]
    );

    if (absRes.rows.length > 0) {
      const absTxt = absRes.rows
        .map(r => `${formatDate(r.start_date)}–${formatDate(r.end_date)}`)
        .join(', ');
      lines.push(`📅 ${member.name} - היעדרות חד פעמית: ${absTxt}${doubleSuffix}`);
      continue;
    }

    // 4. Regular availability for this weekday
    const regRes = await db.query<RegAvailRow>(
      `SELECT * FROM regular_availability
       WHERE staff_id = $1 AND day_of_week = $2`,
      [member.id, weekday]
    );

    // Check hour-block rows first
    const blockRows = regRes.rows.filter(
      r =>
        r.time_start !== null &&
        r.time_end !== null &&
        timesOverlap(slotStartTime, slotEndTime, r.time_start, r.time_end)
    );

    if (blockRows.length > 0) {
      const blockTxt = blockRows.map(r => `${r.time_start}–${r.time_end}`).join(', ');
      lines.push(`⛔ ${member.name} - לא פנוי קבוע בשעות: ${blockTxt}${doubleSuffix}`);
      continue;
    }

    // Whole-day availability row (no time block)
    const wholeDayRow = regRes.rows.find(r => r.time_start === null);

    let statusTxt: string;
    if (!wholeDayRow) {
      statusTxt = `⚪ ${member.name} - ללא נתון זמינות`;
    } else if (wholeDayRow.availability === 'לא זמין') {
      statusTxt = `❌ ${member.name} - לא זמין קבוע ביום זה`;
    } else if (wholeDayRow.availability === 'זמין בתיאום מראש') {
      statusTxt = `🟡 ${member.name} - זמין בתיאום מראש`;
    } else {
      statusTxt = `✅ ${member.name} - זמין לחלוטין`;
    }

    const notesSuffix =
      wholeDayRow?.notes ? ` 📝 ${wholeDayRow.notes}` : '';
    lines.push(statusTxt + doubleSuffix + notesSuffix);
  }

  return lines.join('\n');
}

// ─── Function 3: check ALL core staff availability ───────────────────────────
export async function checkAllCoreStaffAvailability(
  sessionId: string,
  db: Pool
): Promise<string> {
  const sessionRes = await db.query<{
    start_datetime: Date;
    end_datetime: Date;
    calendar_type_name: string | null;
  }>(
    `SELECT s.start_datetime, s.end_datetime, ct.name AS calendar_type_name
     FROM sessions s
     LEFT JOIN calendar_types ct ON ct.id = s.calendar_type_id
     WHERE s.id = $1`,
    [sessionId]
  );
  if (!sessionRes.rows[0]) return '';

  const { start_datetime, end_datetime, calendar_type_name } = sessionRes.rows[0];

  // Skip availability check for holidays
  if (calendar_type_name === 'חופשות') return '';

  const weekday = getHebrewWeekday(start_datetime);

  const coreRes = await db.query<StaffRow>(
    `SELECT id, name, status FROM staff WHERE status = 'ליבה' ORDER BY name`
  );

  const lines: string[] = [];

  for (const member of coreRes.rows) {
    // One-time absence
    const absRes = await db.query<{ cnt: string }>(
      `SELECT COUNT(*) AS cnt FROM one_time_absences
       WHERE staff_id = $1 AND start_date < $2 AND end_date > $3`,
      [member.id, end_datetime, start_datetime]
    );
    if (parseInt(absRes.rows[0]?.cnt ?? '0', 10) > 0) {
      lines.push(`📅 ${member.name} - היעדרות חד פעמית`);
      continue;
    }

    // Regular availability
    const regRes = await db.query<RegAvailRow>(
      `SELECT * FROM regular_availability
       WHERE staff_id = $1 AND day_of_week = $2 AND time_start IS NULL
       LIMIT 1`,
      [member.id, weekday]
    );
    const row = regRes.rows[0];

    if (!row) {
      lines.push(`⚪ ${member.name} - ללא נתון זמינות`);
    } else if (row.availability === 'לא זמין') {
      lines.push(`❌ ${member.name} - לא זמין קבוע ביום זה`);
    } else if (row.availability === 'זמין בתיאום מראש') {
      lines.push(`🟡 ${member.name} - זמין בתיאום מראש`);
    } else {
      lines.push(`✅ ${member.name} - זמין לחלוטין`);
    }
  }

  return lines.sort().join('\n');
}

// ─── Function 4: concurrent sessions in other calendars ──────────────────────
export async function getConflictingSessions(
  sessionId: string,
  db: Pool
): Promise<string> {
  const sessionRes = await db.query<{ start_datetime: Date; end_datetime: Date }>(
    `SELECT start_datetime, end_datetime FROM sessions WHERE id = $1`,
    [sessionId]
  );
  if (!sessionRes.rows[0]) return '';
  const { start_datetime, end_datetime } = sessionRes.rows[0];

  const res = await db.query<{
    staff_name: string;
    course_name: string;
    calendar_type_name: string;
  }>(
    `SELECT DISTINCT
       st.name       AS staff_name,
       c.name        AS course_name,
       ct.name       AS calendar_type_name
     FROM sessions s
     JOIN session_staff ss ON ss.session_id = s.id
     JOIN staff st         ON st.id = ss.staff_id
     JOIN courses c        ON c.id = s.course_id
     LEFT JOIN calendar_types ct ON ct.id = s.calendar_type_id
     WHERE s.id != $1
       AND s.start_datetime < $2
       AND s.end_datetime   > $3
     ORDER BY st.name`,
    [sessionId, end_datetime, start_datetime]
  );

  if (res.rows.length === 0) return '✅ זמן ללא שיבוץ של אנשי סגל';

  const lines = res.rows.map(
    r => `${r.staff_name} - ${r.course_name} (${r.calendar_type_name ?? ''})`
  );
  return [...new Set(lines)].join('\n');
}
