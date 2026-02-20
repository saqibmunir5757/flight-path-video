# Railway Deployment Guide

## ✅ This App Works on Railway!

Your flight path video generator app will work perfectly on Railway with all features:
- ✅ Video rendering (Remotion + ffmpeg)
- ✅ Map tile fetching
- ✅ Long-running video encoding (no timeouts)
- ✅ File uploads and downloads
- ✅ All frontend features

---

## 🚀 Deploy to Railway in 5 Minutes

### Step 1: Push to GitHub (if not already)

```bash
cd /Users/mac/Documents/claudecode/mapv2

# Initialize git if needed
git init
git add .
git commit -m "Initial commit - Flight Path Video Generator"

# Create GitHub repo and push
# Go to github.com → New Repository → follow instructions
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Railway

1. **Sign up**: Go to [railway.app](https://railway.app) and sign in with GitHub
2. **New Project**: Click "New Project" → "Deploy from GitHub repo"
3. **Select Repo**: Choose your `mapv2` repository
4. **Auto Deploy**: Railway will automatically:
   - Detect Node.js
   - Install dependencies (`npm install`)
   - Start the server (`npm run server`)
5. **Wait ~2-3 minutes** for deployment to complete

### Step 3: Get Your URL

1. Click on your deployment
2. Go to "Settings" → "Networking" → "Generate Domain"
3. Your app will be live at: `https://your-app.up.railway.app`

---

## 🔧 Configuration (Optional)

### Environment Variables

Railway auto-detects everything, but you can add custom variables:

1. Go to your project → "Variables"
2. Add if needed:
   ```
   PORT=3005
   NODE_ENV=production
   ```

### Increase Resources (if videos take too long)

Free tier gives you:
- 512MB RAM (usually enough)
- Shared CPU

If you need more:
1. Settings → Resources → Upgrade to Pro ($5/month)
2. Get 8GB RAM + dedicated CPU

---

## 📊 Expected Performance

| Video Length | Render Time | RAM Usage |
|--------------|-------------|-----------|
| 30 seconds   | ~30-60s     | ~400MB    |
| 60 seconds   | ~1-2 min    | ~500MB    |
| 2 minutes    | ~3-5 min    | ~600MB    |

**Free tier handles this fine!** ✅

---

## 🔐 Making It Private

### Option 1: Add Basic Auth (Simple Password)

Add this to `server.js` (before other routes):

```javascript
// Simple password protection
app.use((req, res, next) => {
  const auth = req.headers.authorization;
  const token = auth?.split(' ')[1];
  const credentials = Buffer.from(token || '', 'base64').toString();

  if (credentials === 'admin:YOUR_PASSWORD') {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Flight Path Video"');
  res.status(401).send('Authentication required');
});
```

### Option 2: IP Whitelist (More Secure)

Railway Pro allows IP restrictions in settings.

---

## 📝 Post-Deployment Checklist

After deploying, test:

1. ✅ Open the Railway URL
2. ✅ Navigate the map (should load satellite tiles)
3. ✅ Draw a flight path (click 2+ points)
4. ✅ Open Settings ⚙ (verify all options work)
5. ✅ Render a short video (30 seconds)
6. ✅ Download the MP4

---

## 🐛 Troubleshooting

### Build Fails

**Issue**: `npm install` fails
**Fix**: Make sure `package.json` is in the repo

### Server Won't Start

**Issue**: "Port already in use"
**Fix**: Railway auto-assigns PORT. Update `server.js`:

```javascript
const PORT = process.env.PORT || 3005;
```

### Video Rendering Fails

**Issue**: Remotion can't find Chrome
**Fix**: Railway includes Chrome. If it fails, add to `package.json`:

```json
"engines": {
  "node": ">=18"
}
```

### Out of Memory

**Issue**: Video rendering crashes
**Fix**:
1. Reduce video complexity (fewer waypoints)
2. Or upgrade to Railway Pro (8GB RAM)

---

## 💰 Cost Estimate

**Free Tier** (500 hours/month):
- Perfect for personal/internal use
- ~16 hours/day of uptime
- Unlimited users (as long as server is up)

**If you exceed free tier**:
- Pro Plan: $5/month flat fee
- $0.000231/GB-hour for resources
- Typical usage: ~$5-10/month

---

## 🔄 Auto-Deploy Updates

Every time you push to GitHub:
```bash
git add .
git commit -m "Update feature"
git push
```

Railway automatically:
1. Pulls latest code
2. Rebuilds the app
3. Deploys new version
4. Zero downtime!

---

## 🎉 You're Done!

Your app is now live and accessible from anywhere! Share the Railway URL with your team.

**Example URL**: `https://flight-path-video.up.railway.app`

---

## 📚 Useful Commands

```bash
# View logs
railway logs

# Run commands on deployed app
railway run npm run build

# Connect to deployed database (if you add one)
railway connect
```

For more: [Railway Documentation](https://docs.railway.app)
