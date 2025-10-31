# DigitalOcean App Platform Deployment Guide

**✅ UPDATED & VERIFIED - Ready for Deployment**

Complete step-by-step guide to deploy your Student AI Companion app to DigitalOcean App Platform using GitHub repository.

> **Note**: This guide has been updated and verified with your current project configuration. All settings match your actual setup.

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] A GitHub account with your repository uploaded
- [ ] A DigitalOcean account (sign up at [digitalocean.com](https://digitalocean.com))
- [ ] Your repository is public or you have GitHub OAuth access configured
- [ ] Basic understanding of environment variables

## 🏗️ Project Structure Overview

Your app consists of:
- **Frontend**: React + TypeScript + Vite (Port 5173+ in dev, auto-selects available port)
- **Backend**: Express + TypeScript API (Port 3001 in dev, 8080 in production)
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
      repo: meadiljan/Student-AI-Companion
      branch: main
      deploy_on_push: true
    run_command: npm start
    build_command: npm install && npm run build
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
    type: static_site
    source_dir: frontend
    github:
      repo: meadiljan/Student-AI-Companion
      branch: main
      deploy_on_push: true
    build_command: npm install && npm run build
    environment_slug: node-js
    output_dir: dist
    index_document: index.html
    error_document: index.html
    env:
      - key: VITE_API_URL
        value: ${backend.PUBLIC_URL}/api
    routes:
      - path: /
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
In your DigitalOcean frontend service, add this environment variable:
```
VITE_API_URL=https://your-backend-url.ondigitalocean.app/api
```

**For your current deployment:**
```
VITE_API_URL=https://urchin-app-qch6j.ondigitalocean.app/api
```

> **Important**: Replace `your-backend-url` with your actual backend URL from DigitalOcean.

### Step 5: Update Your Code for Production

#### 5.1 Update Backend for Production
Your backend is already configured for production! The current setup includes:

- **Smart CORS**: Automatically allows DigitalOcean domains
- **Environment Detection**: Switches between dev and production automatically
- **Port Configuration**: Uses 8080 for production, 3001 for development

No additional backend changes needed - everything is ready!

#### 5.2 Update Frontend API Configuration
Your frontend is already configured! The `frontend/src/config/api.ts` file automatically:

- **Development**: Uses Vite proxy (`/api`) 
- **Production**: Uses environment variable from DigitalOcean

No additional frontend changes needed - everything is ready!

#### 5.3 Package.json Files
Your `package.json` files are already correctly configured with:

**Backend package.json** ✅:
- ✅ Correct build and start scripts
- ✅ Node.js engine requirement (>=18.0.0)
- ✅ All dependencies properly listed

**Frontend package.json** ✅:
- ✅ Vite build configuration
- ✅ Node.js engine requirement (>=18.0.0)  
- ✅ All dependencies properly listed

Everything is ready for deployment!

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

#### 7.2 Automatic Configuration ✅
Your app is configured for automatic setup:
- **Environment Variables**: Automatically set by DigitalOcean
- **API URLs**: Frontend automatically connects to backend
- **CORS**: Automatically configured for DigitalOcean domains

No manual configuration needed!

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
- **Lockfile conflicts**: Your backend includes `.npmrc` to handle dependency resolution
- **ts-node issues**: TypeScript and @types/node are in dependencies for production builds

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

## � Troubleshooting

### Common Issues and Solutions

#### 1. Frontend Shows Blank White Screen
**Problem**: Frontend deploys successfully but shows blank white screen in production.

**Solution**: This was caused by complex Vite configuration. **Already Fixed!** ✅

The Vite configuration has been simplified to resolve React production build issues:
- Removed complex manual chunking that was causing conflicts
- Simplified to use safe, basic chunking strategy
- Removed problematic `dyadComponentTagger` plugin from production builds

**If you still see issues**:
1. Check browser console for JavaScript errors
2. Verify API endpoints are accessible
3. Ensure environment variables are set correctly

#### 2. Build Dependency Errors
**Problem**: Error about TypeScript dependencies during build.

**Solution**: **Already Fixed!** ✅
- TypeScript and @types/node moved to `dependencies` (not devDependencies)
- Added `.npmrc` file for proper dependency resolution

#### 3. API Connection Issues
**Problem**: Frontend can't connect to backend API.

**Solutions**:
1. Check CORS configuration in backend
2. Verify API URL environment variable
3. Ensure backend service is running and healthy

#### 4. Build Timeouts
**Problem**: Build process times out on DigitalOcean.

**Solutions**:
1. Optimize package.json dependencies
2. Use npm instead of pnpm for DigitalOcean builds
3. Consider using cache optimization

#### 5. Memory Issues During Build
**Problem**: Build fails due to memory constraints.

**Solutions**:
1. Increase instance size temporarily for builds
2. Optimize bundle size and chunks
3. Remove unnecessary dependencies

### 🔍 Debugging Tips

1. **Check Build Logs**: Always review both frontend and backend build logs
2. **Runtime Logs**: Monitor application logs after deployment
3. **Environment Variables**: Verify all required environment variables are set
4. **Health Checks**: Use DigitalOcean health checks to monitor service status

## �🔐 Security Best Practices

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