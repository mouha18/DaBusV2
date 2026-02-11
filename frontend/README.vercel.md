# Vercel Deployment Guide for DaBus V2

## Deployment Options

### Option 1: Single Deployment (Frontend + API Routes)
Deploy only the `frontend/` folder - it includes both the Next.js app and Vercel API routes.

### Option 2: Separate Deployments
- Deploy `frontend/` as Next.js app
- Deploy `backend/` as Express server using Vercel

## Environment Variables (Required in Vercel Dashboard)

Add these environment variables in your Vercel project settings:

### For Frontend Deployment:
| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_API_URL` | `/api` |

### For Backend Deployment (if using separate deployment):
| Variable | Value |
|----------|-------|
| `JWT_SECRET` | Your JWT secret |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `FRONTEND_URL` | Your Vercel frontend URL |

## API Endpoints (Vercel API Routes)

The frontend includes built-in API routes:

- `POST /api/auth/login` - User login
- `GET /api/trips` - List all trips
- `GET /api/trips/[id]` - Get trip details
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create booking
- `GET /api/admin/stats` - Admin dashboard stats
- `GET /api/admin/trips` - Admin trip management
- `GET /api/admin/bookings` - Admin booking management
- `POST /api/admin/bookings/[id]/status` - Update booking status

## Local Development

```bash
# Install dependencies
cd frontend
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Demo Mode

The API routes include demo data that works without Supabase configuration. Use these credentials:
- **Admin:** admin@dabus.com / ChangeThisPassword123!
- **Regular User:** Any email/password combination works for demo mode

## Production Setup

1. Connect your GitHub repository to Vercel
2. Import the `frontend/` folder as a new project
3. Add environment variables in Vercel dashboard
4. Deploy!

## Troubleshooting

### CORS Errors
Ensure `FRONTEND_URL` is correctly set in environment variables.

### Module Not Found Errors
Run `npm install` in the frontend directory before building.

### API Not Responding
Check Vercel function logs in the dashboard for error details.
