#!/bin/bash

# Invoice App Deployment Script

echo "🚀 Starting Invoice App Deployment..."

# 1. Build the application
echo "📦 Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# 2. Check environment variables
echo "🔐 Checking environment variables..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set!"
    exit 1
fi
if [ -z "$RESEND_API_KEY" ]; then
    echo "❌ RESEND_API_KEY not set!"
    exit 1
fi
if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET not set!"
    exit 1
fi

echo "✅ All environment variables set"

# 3. Test database connection
echo "🗄️  Testing database connection..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✅ Database connection successful');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });
"

if [ $? -ne 0 ]; then
    echo "❌ Database connection failed!"
    exit 1
fi

# 4. Start application
echo "▶️  Starting application..."
npm start

echo "✅ Deployment complete!"
