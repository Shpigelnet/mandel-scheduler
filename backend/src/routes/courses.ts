import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

const FULL_QUERY = `
  SELECT
    c.id, c.name,
    ct.id   AS calendar_type_id,   ct.name  AS calendar_type_name,
    ka.id   AS knowledge_area_id,  ka.name  AS knowledge_area_name,
    mt.id   AS meeting_type_id,    mt.name  AS meeting_type_name,
    st.id   AS super_topic_id,     st.name  AS super_topic_name,
    cst.id  AS combined_super_topic_id, cst.name AS combined_super_topic_name,
    COALESCE(
      json_agg(
        json_build_object('id', s.id, 'name', s.name, 'status', s.status)
      ) FILTER (WHERE s.id IS NOT NULL),
      '[]'
    ) AS staff
  FROM courses c
  LEFT JOIN calendar_types ct         ON ct.id  = c.calendar_type_id
  LEFT JOIN knowledge_areas ka        ON ka.id  = c.knowledge_area_id
  LEFT JOIN meeting_types mt          ON mt.id  = c.meeting_type_id
  LEFT JOIN super_topics st           ON st.id  = c.super_topic_id
  LEFT JOIN combined_super_topics cst ON cst.id = c.combined_super_topic_id
  LEFT JOIN course_staff cs           ON cs.course_id = c.id
  LEFT JOIN staff s                   ON s.id = cs.staff_id
`;

router.get('/', async (_req, res) => {
  const r = await pool.query(FULL_QUERY + ' GROUP BY c.id,ct.id,ka.id,mt.id,st.id,cst.id ORDER BY c.name');
  res.json(r.rows);
});

router.get('/:id', async (req, res) => {
  const r = await pool.query(
    FULL_QUERY + ' WHERE c.id = $1 GROUP BY c.id,ct.id,ka.id,mt.id,st.id,cst.id',
    [req.params.id]
  );
  if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
});

router.post('/', async (req, res) => {
  const { name, calendar_type_id, knowledge_area_id, meeting_type_id, super_topic_id, combined_super_topic_id, staff_ids } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      `INSERT INTO courses (name, calendar_type_id, knowledge_area_id, meeting_type_id, super_topic_id, combined_super_topic_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, calendar_type_id || null, knowledge_area_id || null, meeting_type_id || null, super_topic_id || null, combined_super_topic_id || null]
    );
    const courseId = r.rows[0].id;
    if (staff_ids?.length) {
      for (const sid of staff_ids) {
        await client.query('INSERT INTO course_staff (course_id, staff_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [courseId, sid]);
      }
    }
    await client.query('COMMIT');
    res.status(201).json(r.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  const { name, calendar_type_id, knowledge_area_id, meeting_type_id, super_topic_id, combined_super_topic_id, staff_ids } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      `UPDATE courses SET name=$1, calendar_type_id=$2, knowledge_area_id=$3,
       meeting_type_id=$4, super_topic_id=$5, combined_super_topic_id=$6
       WHERE id=$7 RETURNING *`,
      [name, calendar_type_id || null, knowledge_area_id || null, meeting_type_id || null, super_topic_id || null, combined_super_topic_id || null, req.params.id]
    );
    if (!r.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
    if (staff_ids !== undefined) {
      await client.query('DELETE FROM course_staff WHERE course_id = $1', [req.params.id]);
      for (const sid of staff_ids) {
        await client.query('INSERT INTO course_staff (course_id, staff_id) VALUES ($1,$2)', [req.params.id, sid]);
      }
    }
    await client.query('COMMIT');
    res.json(r.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM courses WHERE id = $1', [req.params.id]);
  res.status(204).send();
});

export default router;
