# Railway Deployment Guide

## Why Railway?
- **No timeout limits** (Vercel free tier = 10 seconds max)
- **Free tier available** (500 hours/month)
- Handles AWS Lambda render calls perfectly

## Quick Deploy to Railway

1. **Go to Railway**: https://railway.app
2. **Sign up** with GitHub
3. **New Project** → Deploy from GitHub repo
4. **Select repository**: `saqibmunir5757/flight-path-video`
5. **Add environment variables**:
   ```
   AWS_ACCESS_KEY_ID=<your-key-id>
   AWS_SECRET_ACCESS_KEY=<your-secret-key>
   AWS_REGION=ap-south-1
   PORT=3001
   ```
6. **Deploy** - Railway will automatically run `npm start` (railway-server.js)
7. **Copy the Railway URL** (e.g., `https://flight-path-video-production.up.railway.app`)

## Update Frontend

After Railway is deployed, update Vercel frontend to use Railway for renders:

1. Go to your Vercel project settings
2. Add environment variable:
   ```
   RAILWAY_RENDER_API=https://your-app.up.railway.app
   ```
3. Or update `web/index.html` line ~1257 to:
   ```javascript
   const res = await fetch('https://your-railway-app.up.railway.app/api/render', {
   ```

## Architecture

```
User Browser
    ↓
Vercel (frontend + snapshot API - 10s limit)
    ↓
Railway (render API ONLY - no timeout!)
    ↓
AWS Lambda (video rendering in Mumbai)
    ↓
S3 (final video storage)
```

## Cost

- **Vercel**: FREE (hosting frontend)
- **Railway**: FREE tier (500 execution hours/month)
- **AWS Lambda**: Pay per render (~$0.02-0.10 per video)

Total: Basically free for internal use!
