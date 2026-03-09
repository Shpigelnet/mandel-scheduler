import { Router } from 'express';
import pool from '../db/pool';
import {
  getHebrewWeekday,
  checkAssignedStaffAvailability,
  checkAllCoreStaffAvailability,
  getConflictingSessions,
} from '../services/availabilityService';

const router = Router();

async function enrichSession(row: any) {
  const [staffAvail, coreAvail, conflicts] = await Promise.all([
    checkAssignedStaffAvailability(row.id, pool),
    checkAllCoreStaffAvailability(row.id, pool),
    getConflictingSessions(row.id, pool),
  ]);
  return {
    ...row,
    assignment_day: getHebrewWeekday(new Date(row.start_datetime)),
    staff_availability: staffAvail,
    all_core_availability: coreAvail,
    concurrent_sessions: conflicts,
  };
}

const SESSION_QUERY = `
  SELECT
    s.id, s.notes,
    s.start_datetime, s.end_datetime,
    json_build_object('id', c.id, 'name', c.name) AS course,
    json_build_object('id', ct.id, 'name', ct.name) AS calendar_type,
    COALESCE(
      json_agg(
        DISTINCT jsonb_build_object('id', st.id, 'name', st.name, 'status', st.status)
      ) FILTER (WHERE st.id IS NOT NULL),
      '[]'
    ) AS staff
  FROM sessions s
  LEFT JOIN courses c        ON c.id = s.course_id
  LEFT JOIN calendar_types ct ON ct.id = s.calendar_type_id
  LEFT JOIN session_staff ss ON ss.session_id = s.id
  LEFT JOIN staff st         ON st.id = ss.staff_id
`;

router.get('/', async (req, res) => {
  const { calendar_type_id, start, end } = req.query;
  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (calendar_type_id) {
    params.push(calendar_type_id);
    where += ` AND s.calendar_type_id = $${params.length}`;
  }
  if (start) {
    params.push(start);
    where += ` AND s.start_datetime >= $${params.length}`;
  }
  if (end) {
    params.push(end);
    where += ` AND s.end_datetime <= $${params.length}`;
  }
  const r = await pool.query(
    SESSION_QUERY + where + ' GROUP BY s.id, c.id, ct.id ORDER BY s.start_datetime',
    params
  );
  const enriched = await Promise.all(r.rows.map(enrichSession));
  res.json(enriched);
});

router.get('/:id', async (req, res) => {
  const r = await pool.query(
    SESSION_QUERY + ' WHERE s.id = $1 GROUP BY s.id, c.id, ct.id',
    [req.params.id]
  );
  if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(await enrichSession(r.rows[0]));
});

router.get('/:id/computed', async (req, res) => {
  const { id } = req.params;
  const basic = await pool.query('SELECT start_datetime FROM sessions WHERE id = $1', [id]);
  if (!basic.rows[0]) return res.status(404).json({ error: 'Not found' });
  const [staffAvail, coreAvail, conflicts] = await Promise.all([
    checkAssignedStaffAvailability(id, pool),
    checkAllCoreStaffAvailability(id, pool),
    getConflictingSessions(id, pool),
  ]);
  res.json({
    assignment_day: getHebrewWeekday(new Date(basic.rows[0].start_datetime)),
    staff_availability: staffAvail,
    all_core_availability: coreAvail,
    concurrent_sessions: conflicts,
  });
});

router.post('/', async (req, res) => {
  const { course_id, start_datetime, end_datetime, calendar_type_id, notes, staff_ids } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      `INSERT INTO sessions (course_id, start_datetime, end_datetime, calendar_type_id, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [course_id || null, start_datetime, end_datetime, calendar_type_id || null, notes || null]
    );
    const sessionId = r.rows[0].id;
    if (staff_ids?.length) {
      for (const sid of staff_ids) {
        await client.query(
          'INSERT INTO session_staff (session_id, staff_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
          [sessionId, sid]
        );
      }
    }
    await client.query('COMMIT');
    // Fetch full row + computed
    const full = await pool.query(SESSION_QUERY + ' WHERE s.id = $1 GROUP BY s.id, c.id, ct.id', [sessionId]);
    res.status(201).json(await enrichSession(full.rows[0]));
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  const { course_id, start_datetime, end_datetime, calendar_type_id, notes, staff_ids } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      `UPDATE sessions SET course_id=$1, start_datetime=$2, end_datetime=$3,
       calendar_type_id=$4, notes=$5 WHERE id=$6 RETURNING *`,
      [course_id || null, start_datetime, end_datetime, calendar_type_id || null, notes || null, req.params.id]
    );
    if (!r.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
    if (staff_ids !== undefined) {
      await client.query('DELETE FROM session_staff WHERE session_id = $1', [req.params.id]);
      for (const sid of staff_ids) {
        await client.query('INSERT INTO session_staff (session_id, staff_id) VALUES ($1,$2)', [req.params.id, sid]);
      }
    }
    await client.query('COMMIT');
    const full = await pool.query(SESSION_QUERY + ' WHERE s.id = $1 GROUP BY s.id, c.id, ct.id', [req.params.id]);
    res.json(await enrichSession(full.rows[0]));
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM sessions WHERE id = $1', [req.params.id]);
  res.status(204).send();
});

export default router;
