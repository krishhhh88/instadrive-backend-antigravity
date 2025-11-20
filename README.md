# InstaDrive Backend

Backend API for InstaDrive - A SaaS platform that automatically schedules and posts videos from Google Drive to Instagram.

## Features

- 🔐 **Authentication** - JWT-based auth with email login
- 📁 **Google Drive Integration** - OAuth2 flow to access user's Drive videos
- 📸 **Instagram Publishing** - Automated Reel posting via Instagram Graph API
- ⏰ **Scheduling System** - Cron-based automated posting at scheduled times
- 🗄️ **Database** - PostgreSQL via Prisma ORM (Supabase)
- 🚀 **Deployment Ready** - Configured for Vercel with cron jobs

## Tech Stack

- **Framework**: Next.js 15 (App Router, API Routes only)
- **Database**: PostgreSQL (Supabase) with Prisma ORM
- **Authentication**: JWT with httpOnly cookies
- **APIs**: Google Drive API, Instagram Graph API
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Supabase recommended)
- Google Cloud Console project with Drive API enabled
- Meta/Facebook Developer account with Instagram Business API access

## Setup Instructions

### 1. Clone and Install

```bash
cd backend
npm install
```

### 2. Database Setup

Create a PostgreSQL database on [Supabase](https://supabase.com):

1. Create new project
2. Copy the connection string from Settings > Database
3. Add to `.env` as `DATABASE_URL`

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string from Supabase
- `JWT_SECRET` - Random secret key for JWT signing
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `INSTAGRAM_APP_ID` & `INSTAGRAM_APP_SECRET` - From Meta Developer Portal
- `FRONTEND_URL` - Your frontend URL (http://localhost:5173 for dev)
- `CRON_SECRET` - Random secret for cron job authentication

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Drive API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### 5. Instagram OAuth Setup

1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create an app with Instagram Basic Display
3. Add Instagram Business API product
4. Configure OAuth redirect URI: `http://localhost:3000/api/auth/instagram/callback`
5. Copy App ID and App Secret to `.env`

**Note**: Instagram API requires a Business or Creator account.

### 6. Run Database Migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 7. Start Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/instagram` - Initiate Instagram OAuth
- `GET /api/auth/instagram/callback` - Instagram OAuth callback

### Dashboard
- `GET /api/dashboard` - Get dashboard stats and recent activity

### Drive
- `GET /api/drive/files` - List video files from Google Drive

### Posts
- `GET /api/posts` - List all scheduled posts
- `POST /api/posts` - Create new scheduled post
- `PATCH /api/posts/[id]` - Update post
- `DELETE /api/posts/[id]` - Delete post
- `POST /api/posts/publish` - Manually publish a post (testing)

### Settings
- `GET /api/settings` - Get connection status

### Cron (Internal)
- `POST /api/cron` - Process scheduled posts (called by Vercel Cron)

## Deployment to Vercel

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Deploy

```bash
vercel
```

### 3. Set Environment Variables

In Vercel dashboard, add all environment variables from `.env`:
- Update `GOOGLE_REDIRECT_URI` to production URL
- Update `INSTAGRAM_REDIRECT_URI` to production URL
- Update `FRONTEND_URL` to your Netlify frontend URL
- Add `CRON_SECRET` for cron job security

### 4. Run Migrations in Production

```bash
npx prisma migrate deploy
```

### 5. Configure Cron Job

The `vercel.json` file already configures a cron job to run every 5 minutes. Vercel will automatically set this up on deployment.

For manual testing, call the cron endpoint with:
```bash
curl -X POST https://your-backend.vercel.app/api/cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── auth/          # Authentication routes
│   │   ├── dashboard/     # Dashboard stats
│   │   ├── drive/         # Google Drive integration
│   │   ├── posts/         # Post management
│   │   ├── settings/      # User settings
│   │   └── cron/          # Scheduled job
│   └── page.tsx           # Root page
├── lib/
│   ├── auth.ts            # JWT authentication helpers
│   ├── google.ts          # Google Drive API helpers
│   ├── instagram.ts       # Instagram Graph API helpers
│   └── prisma.ts          # Prisma client singleton
├── prisma/
│   └── schema.prisma      # Database schema
├── middleware.ts          # CORS middleware
├── next.config.ts         # Next.js configuration
└── vercel.json            # Vercel deployment config
```

## Development Tips

- Use `npx prisma studio` to view/edit database in browser
- Check Vercel logs for cron job execution
- Test OAuth flows in incognito mode
- Instagram API has rate limits - be mindful when testing

## Troubleshooting

**OAuth redirect errors**: Ensure redirect URIs match exactly in Google/Meta console and `.env`

**Database connection issues**: Check Supabase connection string and IP allowlist

**Instagram publish fails**: Verify account is Business/Creator type and has proper permissions

**Cron not running**: Check Vercel logs and ensure `CRON_SECRET` is set

## License

MIT
