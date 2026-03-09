import express from 'express';
import cors from 'cors';
import staffRouter from './routes/staff';
import coursesRouter from './routes/courses';
import sessionsRouter from './routes/sessions';
import lookupsRouter from './routes/lookups';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/staff', staffRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/lookups', lookupsRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

export default app;
