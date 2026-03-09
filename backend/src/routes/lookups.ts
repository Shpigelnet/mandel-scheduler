import { Router } from 'express';
import pool from '../db/pool';

const router = Router();

router.get('/calendar-types', async (_req, res) => {
  const r = await pool.query('SELECT * FROM calendar_types ORDER BY name');
  res.json(r.rows);
});

router.get('/knowledge-areas', async (_req, res) => {
  const r = await pool.query('SELECT * FROM knowledge_areas ORDER BY name');
  res.json(r.rows);
});

router.get('/meeting-types', async (_req, res) => {
  const r = await pool.query('SELECT * FROM meeting_types ORDER BY name');
  res.json(r.rows);
});

router.get('/super-topics', async (_req, res) => {
  const r = await pool.query('SELECT * FROM super_topics ORDER BY name');
  res.json(r.rows);
});

router.get('/combined-super-topics', async (_req, res) => {
  const r = await pool.query('SELECT * FROM combined_super_topics ORDER BY name');
  res.json(r.rows);
});

export default router;
