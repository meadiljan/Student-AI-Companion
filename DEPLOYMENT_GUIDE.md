# DigitalOcean App Platform Deployment Guide

Complete step-by-step guide to deploy your Student AI Companion app to DigitalOcean App Platform using GitHub repository.

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] A GitHub account with your repository uploaded
- [ ] A DigitalOcean account (sign up at [digitalocean.com](https://digitalocean.com))
- [ ] Your repository is public or you have GitHub OAuth access configured
- [ ] Basic understanding of environment variables

## 🏗️ Project Structure Overview

Your app consists of:
- **Frontend**: React + TypeScript + Vite (Port 5173 in dev)
- **Backend**: Express + TypeScript API (Port 3001 in dev)
- **Package Manager**: pnpm
- **Database**: File-based JSON storage

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your GitHub Repository

#### 1.1 Push Your Code to GitHub
```bash
# If not already done
git add .
git commit -m "Prepare for DigitalOcean deployment"
git push origin main
```

#### 1.2 Create App Platform Configuration File
Create a `.do/app.yaml` file in your project root:

```yaml
name: student-ai-companion
services:
  # Backend API Service
  - name: backend
    source_dir: backend
    github:
      repo: your-username/your-repo-name
      branch: main
    run_command: npm start
    build_command: npm run build
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    http_port: 8080
    env:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "8080"
    routes:
      - path: /api
  
  # Frontend Static Site
  - name: frontend
    source_dir: frontend
    github:
      repo: your-username/your-repo-name
      branch: main
    build_command: npm run build
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    routes:
      - path: /
    static_sites:
      - name: frontend
        source_dir: dist
        index_document: index.html
        error_document: index.html
```

### Step 2: Create DigitalOcean App

#### 2.1 Access DigitalOcean Console
1. Log in to your DigitalOcean account
2. Navigate to **Apps** in the left sidebar
3. Click **Create App**

#### 2.2 Connect Your GitHub Repository
1. Select **GitHub** as your source
2. Click **Authorize DigitalOcean** if prompted
3. Select your repository from the dropdown
4. Choose the **main** branch
5. Check **Autodeploy** to enable automatic deployments on push

### Step 3: Configure Backend Service

#### 3.1 Add Backend Service
1. Click **Add Resource** → **Service**
2. Configure the following:
   - **Resource Type**: Service
   - **Source**: Your GitHub repository
   - **Source Directory**: `backend`
   - **Branch**: `main`

#### 3.2 Backend Build Settings
```yaml
Build Command: npm install && npm run build
Run Command: npm start
HTTP Port: 8080
Environment: Node.js
```

#### 3.3 Backend Environment Variables
Add these environment variables:
```
NODE_ENV=production
PORT=8080
```

### Step 4: Configure Frontend Service

#### 4.1 Add Frontend Service
1. Click **Add Resource** → **Static Site**
2. Configure the following:
   - **Resource Type**: Static Site
   - **Source**: Your GitHub repository
   - **Source Directory**: `frontend`
   - **Branch**: `main`

#### 4.2 Frontend Build Settings
```yaml
Build Command: npm install && npm run build
Output Directory: dist
```

#### 4.3 Frontend Environment Variables
Create a `.env.production` file in your frontend directory:
```env
VITE_API_URL=https://your-backend-url.ondigitalocean.app/api
```

### Step 5: Update Your Code for Production

#### 5.1 Update Backend for Production
Create/update `backend/.env` file:
```env
NODE_ENV=production
PORT=8080
CORS_ORIGIN=https://your-frontend-url.ondigitalocean.app
```

Update `backend/src/index.ts` to handle production:
```typescript
const PORT = process.env.PORT || 8080;

// Update CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

#### 5.2 Update Frontend API Configuration
Create `frontend/src/config/api.ts`:
```typescript
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```

Update your API calls to use this base URL.

#### 5.3 Update Package.json Scripts
Ensure your `package.json` files have the correct scripts:

**Backend package.json**:
```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "dev": "ts-node-dev --transpile-only src/index.ts"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Frontend package.json**:
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview",
    "dev": "vite"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Step 6: Deploy Your App

#### 6.1 Review Configuration
1. Review all your settings in the DigitalOcean dashboard
2. Ensure both frontend and backend services are configured
3. Check that environment variables are set correctly

#### 6.2 Deploy
1. Click **Create Resources**
2. Wait for the deployment to complete (5-10 minutes)
3. Monitor the build logs for any errors

### Step 7: Configure Domain and Routing

#### 7.1 Set Up Routes
In your app configuration:
1. Backend service should handle `/api/*` routes
2. Frontend service should handle all other routes (`/*`)

#### 7.2 Update API URLs
Once deployed, update your frontend environment variables with the actual backend URL:
```env
VITE_API_URL=https://your-backend-service-url.ondigitalocean.app/api
```

### Step 8: Test Your Deployment

#### 8.1 Test Frontend
1. Visit your frontend URL
2. Ensure the app loads correctly
3. Check browser console for errors

#### 8.2 Test Backend API
1. Test API endpoints directly:
   ```bash
   curl https://your-backend-url.ondigitalocean.app/api/tasks
   ```
2. Verify CORS is working from your frontend

#### 8.3 Test Integration
1. Ensure frontend can communicate with backend
2. Test all major features of your app

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Build Failures
- **Node version mismatch**: Ensure `engines` field in package.json specifies Node.js 18+
- **Missing dependencies**: Check that all dependencies are in `dependencies`, not just `devDependencies`
- **TypeScript errors**: Ensure TypeScript builds locally before deploying

#### Runtime Errors
- **CORS issues**: Update CORS configuration in backend
- **Environment variables**: Double-check all required env vars are set
- **File paths**: Use absolute paths for file operations

#### API Connection Issues
- **Wrong API URL**: Ensure frontend points to correct backend URL
- **HTTP vs HTTPS**: Ensure protocol matches (use HTTPS in production)
- **Port configuration**: Backend should listen on PORT env variable

### Logs and Debugging
1. Access **Runtime Logs** in DigitalOcean dashboard
2. Check **Build Logs** for deployment issues
3. Use browser developer tools for frontend debugging

## 📊 Monitoring and Maintenance

### Performance Monitoring
- Monitor app performance in DigitalOcean dashboard
- Set up alerts for downtime
- Review resource usage regularly

### Updates and Redeployment
- Push changes to your GitHub repository
- App will automatically redeploy if autodeploy is enabled
- Monitor deployment status in DigitalOcean dashboard

### Scaling
- Increase instance count for higher traffic
- Upgrade instance size if needed
- Consider using DigitalOcean Managed Databases for better performance

## 💰 Cost Estimation

### Basic Setup (Monthly)
- Frontend (Static Site): ~$3/month
- Backend (Basic Service): ~$5/month
- **Total**: ~$8/month

### Production Setup (Monthly)
- Frontend (Static Site): ~$3/month
- Backend (Professional Service): ~$12/month
- Database (if upgraded): ~$15/month
- **Total**: ~$30/month

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit sensitive data to repository
2. **CORS Configuration**: Restrict to your frontend domain only
3. **HTTPS**: Always use HTTPS in production
4. **Input Validation**: Validate all API inputs (already implemented with Zod)
5. **Error Handling**: Don't expose sensitive error details

## 📚 Additional Resources

- [DigitalOcean App Platform Documentation](https://docs.digitalocean.com/products/app-platform/)
- [Node.js Deployment Guide](https://docs.digitalocean.com/products/app-platform/languages-frameworks/nodejs/)
- [Static Site Deployment](https://docs.digitalocean.com/products/app-platform/how-to/deploy-static-sites/)

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review DigitalOcean documentation
3. Check build and runtime logs
4. Contact DigitalOcean support if needed

---

**Happy Deploying! 🚀**

Remember to test thoroughly after deployment and monitor your app's performance regularly.