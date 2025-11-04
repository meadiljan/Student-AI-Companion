import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { z } from 'zod';
import { db } from './store';
import { Task, Priority, Status } from './types';

const app = express();
// Load environment variables from server/.env (if present)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Production-ready CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? function (origin: any, callback: any) {
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) return callback(null, true);
        
        // Allow same-domain requests, DigitalOcean URLs, and majauto.app domains
        const allowedOrigins = [
          process.env.CORS_ORIGIN,
          /.*\.ondigitalocean\.app$/,
          /.*\.digitaloceanspaces\.com$/,
          /.*\.majauto\.app$/,
          'https://majauto.app',
          'http://majauto.app'
        ].filter(Boolean);
        
        const isAllowed = allowedOrigins.some(allowed => {
          if (typeof allowed === 'string') return origin === allowed;
          if (allowed instanceof RegExp) return allowed.test(origin);
          return false;
        });
        
        callback(null, isAllowed);
      }
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Schemas
const taskCreateSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueTime: z.string().optional(),
  priority: z.enum(['low','medium','high']).default('medium'),
  status: z.enum(['completed','in-progress','pending','overdue']).default('pending'),
  course: z.string().default('General'),
  tags: z.array(z.string()).default([]),
  completed: z.boolean().default(false),
  starred: z.boolean().default(false)
});

const taskUpdateSchema = taskCreateSchema.partial();

const listQuerySchema = z.object({
  course: z.string().optional(),
  priority: z.enum(['low','medium','high']).optional(),
  completed: z.coerce.boolean().optional(),
  starred: z.coerce.boolean().optional(),
  overdue: z.coerce.boolean().optional(),
  today: z.coerce.boolean().optional(),
  thisWeek: z.coerce.boolean().optional(),
  search: z.string().optional()
});

function filterByQuery(tasks: Task[], q: z.infer<typeof listQuerySchema>): Task[] {
  const today = new Date();
  today.setHours(0,0,0,0);
  return tasks.filter(t => {
    if (q.course && t.course !== q.course) return false;
    if (q.priority && t.priority !== q.priority) return false;
    if (q.completed !== undefined && t.completed !== q.completed) return false;
    if (q.starred !== undefined && t.starred !== q.starred) return false;
    if (q.overdue) {
      const d = new Date(t.dueDate); d.setHours(0,0,0,0);
      if (!(d < today && !t.completed)) return false;
    }
    if (q.today) {
      const d = new Date(t.dueDate); d.setHours(0,0,0,0);
      if (d.getTime() !== today.getTime()) return false;
    }
    if (q.thisWeek) {
      const d = new Date(t.dueDate); d.setHours(0,0,0,0);
      const week = new Date(today); week.setDate(today.getDate()+7);
      if (d < today || d > week) return false;
    }
    if (q.search) {
      const s = q.search.toLowerCase();
      const inTitle = t.title.toLowerCase().includes(s);
      const inDesc = (t.description||'').toLowerCase().includes(s);
      if (!inTitle && !inDesc) return false;
    }
    return true;
  });
}

// Routes
// Mount an API router under /api so frontend can call /api/tasks etc.
import { Router } from 'express';

const api = Router();

api.get('/health', (_req: Request, res: Response) => res.json({ ok: true }));

// API root
api.get('/', (_req: Request, res: Response) => {
  return res.json({ message: 'API is running ✅' });
});

// List tasks with filters
api.get('/tasks', (req: Request, res: Response) => {
  const q = listQuerySchema.safeParse(req.query);
  if (!q.success) return res.status(400).json({ error: q.error.flatten() });
  const tasks = db.readTasks();
  return res.json({ tasks: filterByQuery(tasks, q.data) });
});

// Create task
api.post('/tasks', (req: Request, res: Response) => {
  const body = taskCreateSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });
  const tasks = db.readTasks();
  const providedId = body.data.id && body.data.id.trim().length > 0 ? body.data.id : Date.now().toString();
  const { id, ...rest } = body.data;
  const newTask: Task = { id: providedId, ...rest } as Task;
  db.writeTasks([...tasks, newTask]);
  return res.status(201).json({ task: newTask });
});

// Update task
api.patch('/tasks/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const body = taskUpdateSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });
  const tasks = db.readTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const updated = { ...tasks[idx], ...body.data };
  tasks[idx] = updated;
  db.writeTasks(tasks);
  return res.json({ task: updated });
});

// Delete task
api.delete('/tasks/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const tasks = db.readTasks();
  const next = tasks.filter(t => t.id !== id);
  if (next.length === tasks.length) return res.status(404).json({ error: 'Not found' });
  db.writeTasks(next);
  return res.status(204).send();
});

// Bulk operations
const bulkSchema = z.object({
  criteria: listQuerySchema.partial().optional(),
  taskIds: z.array(z.string()).optional(),
  update: taskUpdateSchema.optional(),
  operation: z.enum(['delete','complete','star','update','clear-completed','clear-overdue','clear-pending'])
});

api.post('/tasks/bulk', (req: Request, res: Response) => {
  const parsed = bulkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { criteria, taskIds, update, operation } = parsed.data;

  let tasks = db.readTasks();
  let target: Task[] = [];
  if (taskIds && taskIds.length > 0) {
    target = tasks.filter(t => taskIds.includes(t.id));
  } else if (criteria) {
    target = filterByQuery(tasks, criteria);
  } else if (operation === 'clear-completed') {
    target = tasks.filter(t => t.completed);
  } else if (operation === 'clear-overdue') {
    const today = new Date(); today.setHours(0,0,0,0);
    target = tasks.filter(t => new Date(t.dueDate) < today && !t.completed);
  }

  switch (operation) {
    case 'delete':
      tasks = tasks.filter(t => !target.some(x => x.id === t.id));
      db.writeTasks(tasks);
      return res.json({ affected: target.length });
    case 'complete':
      tasks = tasks.map(t => target.some(x => x.id === t.id) ? { ...t, completed: true, status: 'completed' } : t);
      db.writeTasks(tasks);
      return res.json({ affected: target.length });
    case 'star':
      tasks = tasks.map(t => target.some(x => x.id === t.id) ? { ...t, starred: true } : t);
      db.writeTasks(tasks);
      return res.json({ affected: target.length });
    case 'update':
      tasks = tasks.map(t => target.some(x => x.id === t.id) ? { ...t, ...(update || {}) } : t);
      db.writeTasks(tasks);
      return res.json({ affected: target.length });
    case 'clear-completed':
      tasks = tasks.filter(t => !t.completed);
      db.writeTasks(tasks);
      return res.json({ affected: target.length });
    case 'clear-overdue':
      {
        const today = new Date(); today.setHours(0,0,0,0);
        tasks = tasks.filter(t => !(new Date(t.dueDate) < today && !t.completed));
        db.writeTasks(tasks);
        return res.json({ affected: target.length });
      }
    case 'clear-pending':
      {
        const pendingCount = tasks.filter(t => t.status === 'pending').length;
        tasks = tasks.filter(t => t.status !== 'pending');
        db.writeTasks(tasks);
        return res.json({ affected: pendingCount });
      }
  }
});

// Analytics endpoint
api.get('/tasks/analytics', (_req: Request, res: Response) => {
  const tasks = db.readTasks();
  const today = new Date();
  const completed = tasks.filter(t => t.completed).length;
  const overdue = tasks.filter(t => new Date(t.dueDate) < today && !t.completed).length;
  const high = tasks.filter(t => t.priority === 'high' && !t.completed).length;
  res.json({ total: tasks.length, completed, overdue, highPriorityOpen: high });
});

// Mount API router
app.use('/api', api);

// ADMIN: Set LLM API key at runtime by writing to the server/.env file.
// This endpoint is intentionally minimal — it requires an ADMIN_TOKEN header
// that you should set as an environment variable (ADMIN_TOKEN) on the server.
// In production, prefer using a secrets manager instead of writing to .env.
api.post('/admin/set-llm-key', (req: Request, res: Response) => {
  const adminToken = process.env.ADMIN_TOKEN || '';
  const provided = req.headers['x-admin-token'] as string | undefined;
  if (!adminToken || provided !== adminToken) return res.status(403).json({ error: 'forbidden' });
  const body = req.body as { key?: string } | undefined;
  if (!body || !body.key || typeof body.key !== 'string' || body.key.trim().length === 0) {
    return res.status(400).json({ error: 'invalid key' });
  }

  const envPath = path.resolve(__dirname, '..', '.env');
  // Read existing .env lines, preserve other keys, and replace/add LLM_API_KEY
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const lines = existing.split(/\r?\n/).filter(Boolean);
  const filtered = lines.filter(l => !l.startsWith('LLM_API_KEY='));
  filtered.push(`LLM_API_KEY=${body.key.trim()}`);
  fs.writeFileSync(envPath, filtered.join('\n') + '\n', { encoding: 'utf8', flag: 'w' });

  return res.json({ ok: true });
});

const PORT = parseInt(process.env.PORT || '3001', 10);

// In production (DigitalOcean), bind to all interfaces
// In development, default binding is sufficient
if (process.env.NODE_ENV === 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Agent Task API running on 0.0.0.0:${PORT} - API mounted at /api`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`🚀 Agent Task API running on http://localhost:${PORT} - API mounted at /api`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Test API: http://localhost:${PORT}/api/tasks`);
  });
}
