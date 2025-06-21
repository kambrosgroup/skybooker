# Deployment Guide - Enterprise Airline Booking System

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 20.x or higher
- MongoDB 6.x or higher
- pnpm package manager
- Amadeus API account (free tier available)

### 1. Clone and Setup

```bash
# Extract the project files
cd airline-booking-system

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend/airline-booking-frontend
pnpm install
```

### 2. Environment Configuration

#### Backend Environment (.env)
```bash
cd backend
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/airline-booking

# JWT Secrets (generate secure random strings)
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Amadeus API (get from https://developers.amadeus.com)
AMADEUS_CLIENT_ID=your-amadeus-client-id
AMADEUS_CLIENT_SECRET=your-amadeus-client-secret
AMADEUS_ENVIRONMENT=test

# Email Service (optional - for notifications)
EMAIL_SERVICE_API_KEY=your-email-service-key
EMAIL_FROM=noreply@yourdomain.com

# Stripe (optional - for payments)
STRIPE_SECRET_KEY=your-stripe-secret-key

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend Environment (.env)
```bash
cd frontend/airline-booking-frontend
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Stripe (optional)
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# App Configuration
VITE_APP_NAME=SkyBooker
VITE_APP_VERSION=1.0.0
```

### 3. Database Setup

#### Option A: Local MongoDB
```bash
# Install MongoDB locally
# Ubuntu/Debian:
sudo apt-get install mongodb

# macOS:
brew install mongodb/brew/mongodb-community

# Start MongoDB
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

#### Option B: MongoDB Atlas (Recommended)
1. Create account at https://cloud.mongodb.com
2. Create a free cluster
3. Get connection string
4. Update `MONGODB_URI` in backend `.env`

### 4. Amadeus API Setup

1. **Create Account**: Visit https://developers.amadeus.com
2. **Get API Keys**: 
   - Sign up for free account
   - Create a new application
   - Copy Client ID and Client Secret
3. **Update Environment**: Add keys to backend `.env`
4. **Test Environment**: Use `test` environment for development

### 5. Start the Application

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
Backend will start on http://localhost:5000

#### Terminal 2 - Frontend
```bash
cd frontend/airline-booking-frontend
pnpm run dev
```
Frontend will start on http://localhost:5173

### 6. Test the Application

1. **Open Browser**: Navigate to http://localhost:5173
2. **Test Login**: Use demo credentials:
   - User: `user@demo.com` / `password123`
   - Admin: `admin@demo.com` / `admin123`
3. **Test Flight Search**: Try searching for flights
4. **Test Booking**: Create a test booking

## 🐳 Docker Deployment

### Docker Compose (Recommended)

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    container_name: airline-booking-db
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./backend
    container_name: airline-booking-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:password123@mongodb:27017/airline-booking?authSource=admin
    depends_on:
      - mongodb
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend/airline-booking-frontend
    container_name: airline-booking-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:5000/api
    depends_on:
      - backend

volumes:
  mongodb_data:
```

### Backend Dockerfile
Create `backend/Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

### Frontend Dockerfile
Create `frontend/airline-booking-frontend/Dockerfile`:
```dockerfile
FROM node:20-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Start with Docker
```bash
docker-compose up -d
```

## ☁️ Cloud Deployment

### AWS Deployment

#### Backend (EC2 + RDS)
```bash
# 1. Launch EC2 instance (t3.micro for testing)
# 2. Install Node.js and MongoDB
# 3. Clone repository
# 4. Configure environment variables
# 5. Start with PM2

npm install -g pm2
pm2 start npm --name "airline-backend" -- start
pm2 startup
pm2 save
```

#### Frontend (S3 + CloudFront)
```bash
# Build for production
cd frontend/airline-booking-frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Configure CloudFront distribution
# Set up custom domain with Route 53
```

### Vercel Deployment (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend/airline-booking-frontend
vercel --prod
```

### Heroku Deployment (Backend)

```bash
# Install Heroku CLI
# Create Heroku app
heroku create airline-booking-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-atlas-uri
heroku config:set JWT_SECRET=your-jwt-secret

# Deploy
git push heroku main
```

## 🔧 Production Configuration

### Backend Production Settings

```env
NODE_ENV=production
PORT=5000

# Use MongoDB Atlas for production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/airline-booking

# Strong JWT secrets (use random generators)
JWT_SECRET=super-long-random-string-here
JWT_REFRESH_SECRET=another-super-long-random-string

# Production Amadeus
AMADEUS_ENVIRONMENT=production
AMADEUS_CLIENT_ID=production-client-id
AMADEUS_CLIENT_SECRET=production-client-secret

# Email service
EMAIL_SERVICE_API_KEY=production-email-key

# Stripe production
STRIPE_SECRET_KEY=sk_live_...
```

### Frontend Production Settings

```env
VITE_API_URL=https://your-api-domain.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_APP_NAME=SkyBooker
```

### Nginx Configuration

Create `nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    upstream backend {
        server backend:5000;
    }

    server {
        listen 80;
        server_name localhost;

        # Frontend
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;
        }

        # API proxy
        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## 🔐 Security Checklist

### Pre-Production Security

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Validate all environment variables
- [ ] Set up database authentication
- [ ] Configure firewall rules
- [ ] Enable audit logging
- [ ] Set up monitoring and alerts

### SSL/HTTPS Setup

#### Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Backend health
curl http://localhost:5000/api/health

# Database connection
curl http://localhost:5000/api/flights/health
```

### Log Monitoring

```bash
# Backend logs
tail -f backend/logs/app.log

# PM2 logs
pm2 logs airline-backend

# Docker logs
docker logs airline-booking-backend
```

### Performance Monitoring

- **Application**: Use PM2 monitoring or New Relic
- **Database**: MongoDB Compass or Atlas monitoring
- **Frontend**: Google Analytics, Sentry
- **Infrastructure**: CloudWatch, Datadog

## 🔄 Backup & Recovery

### Database Backup

```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/airline-booking" --out=backup/

# Restore
mongorestore --uri="mongodb://localhost:27017/airline-booking" backup/airline-booking/
```

### Automated Backups

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="backups/backup_$DATE"
aws s3 cp "backups/backup_$DATE" s3://your-backup-bucket/ --recursive
```

## 🚨 Troubleshooting

### Common Issues

#### Backend won't start
```bash
# Check MongoDB connection
mongo --eval "db.adminCommand('ismaster')"

# Check environment variables
node -e "console.log(process.env.MONGODB_URI)"

# Check logs
npm run dev 2>&1 | tee debug.log
```

#### Frontend build fails
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check environment
echo $VITE_API_URL
```

#### API calls failing
```bash
# Check CORS settings
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://localhost:5000/api/auth/login
```

### Support

- **Documentation**: Check README.md and API docs
- **Logs**: Always check application logs first
- **Environment**: Verify all environment variables
- **Dependencies**: Ensure all packages are installed
- **Ports**: Check if ports are available and not blocked

## 📞 Production Support

### Monitoring Alerts

Set up alerts for:
- API response times > 2 seconds
- Error rates > 1%
- Database connection failures
- High memory/CPU usage
- SSL certificate expiration

### Maintenance Schedule

- **Daily**: Check application logs
- **Weekly**: Review performance metrics
- **Monthly**: Update dependencies
- **Quarterly**: Security audit
- **Annually**: SSL certificate renewal

This deployment guide provides everything needed to get the airline booking system running in development and production environments.

