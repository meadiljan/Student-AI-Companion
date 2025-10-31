# DigitalOcean Deployment Checklist

## Pre-Deployment Checklist ✅

### Repository Setup
- [ ] Code is pushed to GitHub repository
- [ ] Repository is accessible (public or with proper OAuth setup)
- [ ] All sensitive data is removed from code
- [ ] `.env` files are in `.gitignore`

### Configuration Files
- [ ] `.do/app.yaml` is created and configured
- [ ] `frontend/.env.production` is created
- [ ] `backend/.env.production` is created
- [ ] `frontend/src/config/api.ts` is created

### Package.json Files
- [ ] Backend `package.json` has correct `start` and `build` scripts
- [ ] Frontend `package.json` has correct `build` script
- [ ] Node.js version is specified in `engines` field (>=18.0.0)

### Code Updates
- [ ] Backend CORS is configured for production
- [ ] Backend listens on `0.0.0.0` in production
- [ ] Backend uses correct PORT from environment
- [ ] Frontend API configuration uses environment variables

## Deployment Steps ✅

### DigitalOcean Setup
- [ ] DigitalOcean account created
- [ ] GitHub repository connected
- [ ] App Platform app created

### Backend Service Configuration
- [ ] Service type: Service (not Static Site)
- [ ] Source directory: `backend`
- [ ] Build command: `npm install && npm run build`
- [ ] Run command: `npm start`
- [ ] HTTP port: 8080
- [ ] Environment variables set

### Frontend Service Configuration
- [ ] Service type: Static Site
- [ ] Source directory: `frontend`
- [ ] Build command: `npm install && npm run build`
- [ ] Output directory: `dist`
- [ ] Environment variables set

### Routing Configuration
- [ ] Backend handles `/api/*` routes
- [ ] Frontend handles `/*` routes
- [ ] Error document set to `index.html` for SPA routing

## Post-Deployment Checklist ✅

### URL Updates
- [ ] Frontend `VITE_API_URL` updated with actual backend URL
- [ ] Backend `CORS_ORIGIN` updated with actual frontend URL
- [ ] Test API connectivity from frontend

### Testing
- [ ] Frontend loads successfully
- [ ] All pages navigate correctly
- [ ] API endpoints respond correctly
- [ ] CORS is working properly
- [ ] No console errors in browser

### Monitoring
- [ ] Check deployment logs for errors
- [ ] Monitor app performance
- [ ] Set up alerts if needed

## Common Issues & Solutions 🔧

### Build Failures
- Check Node.js version compatibility
- Ensure all dependencies are in `dependencies` not `devDependencies`
- Review build logs for specific errors

### Runtime Issues
- Check environment variables are set correctly
- Verify API URLs are correct
- Check CORS configuration
- Review runtime logs

### Performance Issues
- Monitor resource usage
- Consider upgrading instance sizes
- Optimize build output sizes

## Important URLs 📝

After deployment, save these URLs:
- Frontend URL: `https://your-app-name.ondigitalocean.app`
- Backend URL: `https://backend-your-app-name.ondigitalocean.app`
- DigitalOcean Dashboard: `https://cloud.digitalocean.com/apps`

## Cost Monitoring 💰

- Monitor monthly costs in DigitalOcean dashboard
- Basic setup: ~$8/month
- Set up billing alerts if needed
- Scale resources based on actual usage

---

**Remember**: Always test thoroughly after deployment and keep your GitHub repository updated for automatic deployments!