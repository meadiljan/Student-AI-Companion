# Local Development Setup Guide

Complete guide to run your Student AI Companion app locally for development, with automatic deployment to DigitalOcean when you push changes.

## 🏗️ Development Environment Overview

Your development setup consists of:
- **Frontend**: React + TypeScript + Vite (runs on `http://localhost:5173`)
- **Backend**: Express + TypeScript API (runs on `http://localhost:3001`)
- **Auto-deployment**: Pushes to GitHub automatically deploy to DigitalOcean

## 🛠️ Prerequisites

Ensure you have installed:
- [ ] **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- [ ] **pnpm** - Install with: `npm install -g pnpm`
- [ ] **Git** - [Download here](https://git-scm.com/)
- [ ] **VS Code** (recommended) - [Download here](https://code.visualstudio.com/)

### Verify Installation
```powershell
# Check Node.js version (should be 18+)
node --version

# Check pnpm
pnpm --version

# Check Git
git --version
```

## 🚀 Quick Start (First Time Setup)

### Step 1: Clone and Install Dependencies

```powershell
# If you haven't cloned the repository yet
git clone https://github.com/meadiljan/Student-AI-Companion.git
cd Student-AI-Companion

# Install all dependencies (frontend + backend)
pnpm run install:all
```

### Step 2: Environment Configuration

The environment files are already set up for you:

**Backend Environment** (`.env`):
```env
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

**Frontend Environment** (`.env.local`):
```env
VITE_API_URL=http://localhost:3001/api
```

### Step 3: Start Development Servers

```powershell
# Option 1: Start both frontend and backend together
pnpm run dev

# Option 2: Start them separately (in different terminals)
# Terminal 1 - Backend
pnpm run dev:backend

# Terminal 2 - Frontend  
pnpm run dev:frontend
```

### Step 4: Access Your App

- **Frontend**: Open `http://localhost:5173` in your browser
- **Backend API**: Available at `http://localhost:3001/api`
- **API Test**: Visit `http://localhost:3001/api/tasks` to test the API

## 📁 Project Structure

```
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── config/
│   │       └── api.ts      # API configuration
│   ├── .env.local          # Local dev environment
│   ├── .env.development    # Development environment
│   └── .env.production     # Production environment
├── backend/                 # Express backend
│   ├── src/
│   │   ├── index.ts        # Main server file
│   │   ├── store.ts        # Data storage
│   │   └── types.ts        # TypeScript types
│   ├── .env                # Local dev environment
│   └── .env.production     # Production environment
└── .do/
    └── app.yaml            # DigitalOcean deployment config
```

## 🔄 Development Workflow

### Daily Development

1. **Start your development environment:**
   ```powershell
   cd path/to/your/project
   pnpm run dev
   ```

2. **Make your changes** in VS Code or your preferred editor

3. **Test your changes** locally at `http://localhost:5173`

4. **Commit and push** when ready:
   ```powershell
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

5. **Automatic deployment** to DigitalOcean happens automatically! 🎉

### Available Scripts

```powershell
# Development
pnpm run dev                 # Start both frontend and backend
pnpm run dev:frontend        # Start only frontend
pnpm run dev:backend         # Start only backend

# Building
pnpm run build              # Build both frontend and backend
pnpm run build:frontend     # Build only frontend
pnpm run build:backend      # Build only backend

# Production (for testing)
pnpm run start              # Start both in production mode
pnpm run start:frontend     # Start frontend in production mode
pnpm run start:backend      # Start backend in production mode

# Dependencies
pnpm run install:all        # Install all dependencies
```

## 🔧 Development Tips

### Hot Reloading
- **Frontend**: Automatically reloads when you save changes
- **Backend**: Automatically restarts when you save changes (using `ts-node-dev`)

### API Development
- Backend API endpoints are automatically prefixed with `/api`
- Test API endpoints directly: `http://localhost:3001/api/tasks`
- Use browser dev tools Network tab to debug API calls

### Environment Variables
- Frontend variables must start with `VITE_`
- Backend variables are loaded from `.env` file
- Never commit sensitive data to git

### Database
- Currently uses JSON file storage (`backend/data/tasks.json`)
- Data persists between server restarts
- Located in `backend/data/` directory

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```powershell
# Kill process on port 3001 (backend)
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Kill process on port 5173 (frontend)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

#### CORS Errors
- Ensure backend `.env` has: `CORS_ORIGIN=http://localhost:5173`
- Check that frontend is accessing: `http://localhost:3001/api`

#### Dependencies Issues
```powershell
# Clear node_modules and reinstall
rm -rf node_modules frontend/node_modules backend/node_modules
rm pnpm-lock.yaml frontend/pnpm-lock.yaml backend/pnpm-lock.yaml
pnpm run install:all
```

#### TypeScript Errors
```powershell
# Check TypeScript in backend
cd backend
npx tsc --noEmit

# Check TypeScript in frontend
cd frontend
npx tsc --noEmit
```

### Development Server Not Starting

1. **Check Node.js version**: Must be 18 or higher
2. **Check if ports are free**: 3001 (backend) and 5173 (frontend)
3. **Check dependencies**: Run `pnpm run install:all`
4. **Check environment files**: Ensure `.env` files exist and are correct

### API Not Connecting

1. **Backend running**: Check `http://localhost:3001/api/tasks`
2. **CORS configuration**: Check backend `.env` file
3. **Frontend API URL**: Check `frontend/.env.local`
4. **Network tab**: Use browser dev tools to see actual requests

## 🚀 Deployment to DigitalOcean

### Automatic Deployment

Your app is configured for **automatic deployment**:

1. **Push to GitHub** → **Automatic deployment to DigitalOcean**
2. **No manual intervention needed**
3. **Check deployment status** in DigitalOcean dashboard

### Manual Deployment Trigger

If needed, you can trigger deployment manually:

1. Go to [DigitalOcean Apps Dashboard](https://cloud.digitalocean.com/apps)
2. Find your app
3. Click "Deploy" → "Force Rebuild and Deploy"

### Environment Variables in Production

Production environment variables are automatically set:
- **Backend**: `NODE_ENV=production`, `PORT=8080`
- **Frontend**: `VITE_API_URL` points to your backend
- **CORS**: Automatically configured between services

## 📊 Monitoring Your App

### Local Development
- **Frontend**: Browser dev tools
- **Backend**: Terminal logs
- **API**: Use tools like Postman or curl

### Production (DigitalOcean)
- **Dashboard**: Monitor performance and logs
- **Runtime Logs**: Check for errors
- **Metrics**: CPU, memory, and request metrics

## 🔒 Security & Best Practices

### Development
- Never commit `.env` files with sensitive data
- Use different API keys for development and production
- Keep dependencies updated

### Production
- Environment variables are securely managed by DigitalOcean
- CORS is properly configured
- HTTPS is automatically enabled

## 📚 Useful Commands

```powershell
# Project setup
git clone https://github.com/meadiljan/Student-AI-Companion.git
cd Student-AI-Companion
pnpm run install:all

# Daily development
pnpm run dev

# Testing builds locally
pnpm run build
pnpm run start

# Updating dependencies
pnpm update
pnpm -C frontend update
pnpm -C backend update

# Git workflow
git add .
git commit -m "Description of changes"
git push origin main
```

## 🆘 Getting Help

### Resources
- [Vite Documentation](https://vitejs.dev/) - Frontend build tool
- [Express Documentation](https://expressjs.com/) - Backend framework  
- [React Documentation](https://react.dev/) - Frontend framework
- [DigitalOcean Docs](https://docs.digitalocean.com/products/app-platform/) - Deployment platform

### Common Questions

**Q: How do I add a new API endpoint?**
A: Add it in `backend/src/index.ts` and update the frontend service calls.

**Q: How do I add a new page?**
A: Create a new component in `frontend/src/pages/` and add the route.

**Q: How do I add environment variables?**
A: Add to `.env` files and prefix frontend vars with `VITE_`.

**Q: How long does deployment take?**
A: Usually 3-5 minutes after pushing to GitHub.

---

## 🎉 You're All Set!

Your development environment is now ready! Start coding, and your changes will automatically deploy to production when you push to GitHub.

**Happy coding! 🚀**