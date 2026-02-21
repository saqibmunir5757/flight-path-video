# Deploy to Your Own Server

## Prerequisites
- Linux server (Ubuntu 20.04+ recommended)
- Root or sudo access
- Domain name pointed to your server IP (optional)

## Step 1: Install Node.js on Server

```bash
# SSH into your server
ssh user@your-server-ip

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should be v20.x
npm --version
```

## Step 2: Clone and Setup

```bash
# Clone your repo
git clone https://github.com/saqibmunir5757/flight-path-video.git
cd flight-path-video

# Install dependencies
npm install

# Test the server
npm run server
```

Server should start on port 3005!

## Step 3: Run as Background Service (PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start server with PM2
pm2 start server.js --name flight-path-video

# Make it auto-start on reboot
pm2 startup
pm2 save

# Check status
pm2 status
pm2 logs flight-path-video
```

## Step 4: Setup Nginx Reverse Proxy (Optional but Recommended)

```bash
# Install Nginx
sudo apt-get install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/flight-path-video
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or server IP

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
    }
}
```

Enable the site:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/flight-path-video /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx on boot
sudo systemctl enable nginx
```

Now your app is accessible at: `http://your-server-ip` or `http://your-domain.com`

## Step 5: Add SSL Certificate (Optional - Free with Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically!
```

Now your app is at: `https://your-domain.com`

## Updating Your App

```bash
# SSH into server
ssh user@your-server-ip
cd flight-path-video

# Pull latest changes
git pull

# Restart PM2
pm2 restart flight-path-video
```

## Monitoring

```bash
# View logs
pm2 logs flight-path-video

# View CPU/memory usage
pm2 monit

# Restart if needed
pm2 restart flight-path-video
```

## Firewall Setup

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
```

## That's It!

Your flight path video generator is now running on your own server! 🚀

**No AWS Lambda costs**
**No Vercel/Railway needed**
**Full control**
