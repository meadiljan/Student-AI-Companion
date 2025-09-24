import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { z } from 'zod';
import { db } from './store';
import { Task, Priority, Status } from './types';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

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
app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }));

// List tasks with filters
app.get('/tasks', (req: Request, res: Response) => {
  const q = listQuerySchema.safeParse(req.query);
  if (!q.success) return res.status(400).json({ error: q.error.flatten() });
  const tasks = db.readTasks();
  return res.json({ tasks: filterByQuery(tasks, q.data) });
});

// Create task
app.post('/tasks', (req: Request, res: Response) => {
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
app.patch('/tasks/:id', (req: Request, res: Response) => {
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
app.delete('/tasks/:id', (req: Request, res: Response) => {
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

app.post('/tasks/bulk', (req: Request, res: Response) => {
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
app.get('/tasks/analytics', (_req: Request, res: Response) => {
  const tasks = db.readTasks();
  const today = new Date();
  const completed = tasks.filter(t => t.completed).length;
  const overdue = tasks.filter(t => new Date(t.dueDate) < today && !t.completed).length;
  const high = tasks.filter(t => t.priority === 'high' && !t.completed).length;
  res.json({ total: tasks.length, completed, overdue, highPriorityOpen: high });
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Agent Task API running on http://localhost:${port}`);
});
