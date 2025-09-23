# Agent Task API

A lightweight Express API to back the AI Agent's task management operations.

## Endpoints

- GET `/health` — service health check
- GET `/tasks` — list tasks (supports filters: `course`, `priority`, `completed`, `starred`, `overdue`, `today`, `thisWeek`, `search`)
- POST `/tasks` — create a task
- PATCH `/tasks/:id` — update partial fields of a task
- DELETE `/tasks/:id` — delete a task
- POST `/tasks/bulk` — bulk operations: `delete`, `complete`, `star`, `update`, `clear-completed`, `clear-overdue`
- GET `/tasks/analytics` — summary metrics

## Dev run

1. Install deps
2. Start dev server

## Notes

- Stores data in `server/data/tasks.json` for simplicity.
- Adjust CORS for your frontend origin if needed.
