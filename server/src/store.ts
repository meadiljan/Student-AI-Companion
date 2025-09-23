import { Task } from './types.js';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(TASKS_FILE)) fs.writeFileSync(TASKS_FILE, JSON.stringify({ tasks: [] }, null, 2));
}

ensureDataFile();

export const db = {
  readTasks(): Task[] {
    const raw = fs.readFileSync(TASKS_FILE, 'utf-8');
    const { tasks } = JSON.parse(raw) as { tasks: Task[] };
    return tasks;
  },
  writeTasks(tasks: Task[]) {
    fs.writeFileSync(TASKS_FILE, JSON.stringify({ tasks }, null, 2));
  }
};
