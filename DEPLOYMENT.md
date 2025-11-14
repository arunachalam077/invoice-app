# Invoice App - Deployment Guide

## Quick Deployment Options

### Option 1: VERCEL (Recommended - Easiest)
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option 2: RENDER (Free tier available)
1. Go to https://render.com
2. Connect GitHub repository
3. Create New Web Service
4. Select "Next.js"
5. Set environment variables:
   - DATABASE_URL
   - JWT_SECRET
   - RESEND_API_KEY
6. Deploy

### Option 3: RAILWAY
1. Go to https://railway.app
2. Connect GitHub
3. Create new project
4. Add environment variables
5. Deploy

### Option 4: AWS/AZURE/DigitalOcean (Self-hosted)

## Environment Variables Required

```
DATABASE_URL=postgresql://neondb_owner:npg_VUHPDxT73szi@ep-raspy-bread-ac2aukv9-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

JWT_SECRET=your-secure-random-string-min-32-chars

RESEND_API_KEY=re_QzTeGNuA_2V5cgYFpYC9gJzvTt8dM4G2Y
```

## Deployment Checklist

- [x] Build successful: `npm run build`
- [x] All 18 routes compiled
- [x] Logo integrated (Sripada Studios)
- [x] PDF generation optimized
- [x] Email sending tested
- [x] Database URL configured
- [x] API keys set

## Post-Deployment

1. Test login at: https://your-domain.com/login
2. Create test invoice
3. Send test email
4. Download PDF to verify logo

## Support

- Database: Neon PostgreSQL (India - SA East region)
- Email: Resend API (configured)
- Frontend: Next.js 16.0.3 with Turbopack
