# Self-Hosting with PM2 (Local Network)

## Setup for Always-Running Server

### 1. Install PM2 (Process Manager)
```bash
npm install -g pm2
```

### 2. Create PM2 Config
```bash
cd /Users/mac/Documents/claudecode/mapv2
pm2 start server.js --name "flight-path-video"
```

### 3. Save PM2 Config to Auto-Start on Reboot
```bash
pm2 save
pm2 startup
# Follow the command it shows
```

### 4. Access from Other Devices on Your Network

Your server is now accessible at:
- **Your Computer**: http://localhost:3005
- **Other devices on network**: http://192.168.100.34:3005

### 5. Optional: Use ngrok for External Access (Free)

If you need occasional external access:

```bash
# Install ngrok
brew install ngrok

# Run ngrok (in separate terminal)
ngrok http 3005
```

You'll get a public URL like `https://abc123.ngrok.io` that tunnels to your local server.

### Useful PM2 Commands

```bash
pm2 list              # See running apps
pm2 logs flight-path-video  # View logs
pm2 restart flight-path-video  # Restart app
pm2 stop flight-path-video     # Stop app
pm2 delete flight-path-video   # Remove app
```

## Security Note

For internal use only! If exposing externally:
- Add authentication
- Use HTTPS
- Restrict IP access
