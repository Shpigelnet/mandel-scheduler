import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

// List all staff
router.get('/', async (_req, res) => {
  const r = await pool.query('SELECT * FROM staff ORDER BY name');
  res.json(r.rows);
});

// Get one staff member
router.get('/:id', async (req, res) => {
  const r = await pool.query('SELECT * FROM staff WHERE id = $1', [req.params.id]);
  if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
});

// Create staff
router.post('/', async (req, res) => {
  const { name, status } = req.body;
  const r = await pool.query(
    'INSERT INTO staff (name, status) VALUES ($1, $2) RETURNING *',
    [name, status]
  );
  res.status(201).json(r.rows[0]);
});

// Update staff
router.put('/:id', async (req, res) => {
  const { name, status } = req.body;
  const r = await pool.query(
    'UPDATE staff SET name = $1, status = $2 WHERE id = $3 RETURNING *',
    [name, status, req.params.id]
  );
  if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
});

// Delete staff
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM staff WHERE id = $1', [req.params.id]);
  res.status(204).send();
});

// Get regular availability for a staff member
router.get('/:id/availability', async (req, res) => {
  const r = await pool.query(
    'SELECT * FROM regular_availability WHERE staff_id = $1 ORDER BY day_of_week',
    [req.params.id]
  );
  res.json(r.rows);
});

// Create/update availability row
router.post('/:id/availability', async (req, res) => {
  const { day_of_week, availability, time_start, time_end, notes } = req.body;
  const r = await pool.query(
    `INSERT INTO regular_availability (staff_id, day_of_week, availability, time_start, time_end, notes)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [req.params.id, day_of_week, availability, time_start || null, time_end || null, notes || null]
  );
  res.status(201).json(r.rows[0]);
});

// Update availability row
router.put('/:id/availability/:avid', async (req, res) => {
  const { day_of_week, availability, time_start, time_end, notes } = req.body;
  const r = await pool.query(
    `UPDATE regular_availability
     SET day_of_week = $1, availability = $2, time_start = $3, time_end = $4, notes = $5
     WHERE id = $6 AND staff_id = $7 RETURNING *`,
    [day_of_week, availability, time_start || null, time_end || null, notes || null, req.params.avid, req.params.id]
  );
  if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
});

// Delete availability row
router.delete('/:id/availability/:avid', async (req, res) => {
  await pool.query('DELETE FROM regular_availability WHERE id = $1 AND staff_id = $2', [
    req.params.avid,
    req.params.id,
  ]);
  res.status(204).send();
});

// Get one-time absences
router.get('/:id/absences', async (req, res) => {
  const r = await pool.query(
    'SELECT * FROM one_time_absences WHERE staff_id = $1 ORDER BY start_date',
    [req.params.id]
  );
  res.json(r.rows);
});

// Create absence
router.post('/:id/absences', async (req, res) => {
  const { start_date, end_date, notes } = req.body;
  const r = await pool.query(
    `INSERT INTO one_time_absences (staff_id, start_date, end_date, notes)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.params.id, start_date, end_date, notes || null]
  );
  res.status(201).json(r.rows[0]);
});

// Update absence
router.put('/:id/absences/:aid', async (req, res) => {
  const { start_date, end_date, notes } = req.body;
  const r = await pool.query(
    `UPDATE one_time_absences SET start_date = $1, end_date = $2, notes = $3
     WHERE id = $4 AND staff_id = $5 RETURNING *`,
    [start_date, end_date, notes || null, req.params.aid, req.params.id]
  );
  if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
});

// Delete absence
router.delete('/:id/absences/:aid', async (req, res) => {
  await pool.query('DELETE FROM one_time_absences WHERE id = $1 AND staff_id = $2', [
    req.params.aid,
    req.params.id,
  ]);
  res.status(204).send();
});

export default router;
