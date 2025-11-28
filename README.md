# AI Trucks - Delivery Planning System (Supabase Version)

A comprehensive web-based delivery planning and fleet management system built with React, TypeScript, Node.js, Express, and **Supabase** (PostgreSQL + Authentication).

## Features

- 🚚 **Vehicle Management** - Track and manage your fleet of delivery vehicles
- 📦 **Delivery Management** - Create and manage delivery orders with location, scheduling, and capacity details
- 🗺️ **Trip Planning** - Assign deliveries to vehicles with capacity validation
- 👥 **User Management** - Role-based access control (Viewer, Delivery Creator, Trip Planner, Admin)
- 📊 **Dashboard** - Real-time overview of deliveries, vehicles, and trips
- 🔐 **Supabase Authentication** - Secure authentication with Supabase Auth
- 🗄️ **Supabase Database** - PostgreSQL with PostGIS for geospatial data

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Supabase Client
- React Router DOM
- Leaflet (Maps)
- Lucide React (Icons)

### Backend
- Node.js + Express + TypeScript
- Supabase (PostgreSQL + PostGIS + Auth)
- JWT Authentication

## Prerequisites

- Node.js (v18 or higher)
- Supabase account (free tier available at [supabase.com](https://supabase.com))
- npm or yarn

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish setting up (~2 minutes)
3. Note your project URL and API keys from Settings > API

### 2. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `backend/src/database/supabase-schema.sql`
3. Paste and run the SQL script to create tables, indexes, and Row Level Security policies

### 3. Configure Authentication

1. In Supabase dashboard, go to **Authentication > Providers**
2. Enable **Email** provider
3. Optionally configure other providers (Google, GitHub, etc.)
4. In **Authentication > URL Configuration**, add your frontend URL (http://localhost:5173)

## Installation

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd AItrucks
\`\`\`

### 2. Backend Setup

\`\`\`bash
cd backend

# Install dependencies
npm install

# Copy Supabase environment template
cp .env.supabase.example .env

# Edit .env with your Supabase credentials
\`\`\`

Update `backend/.env` with your Supabase credentials:

\`\`\`env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres
PORT=3001
NODE_ENV=development
\`\`\`

**Where to find these values:**
- **SUPABASE_URL**: Settings > API > Project URL
- **SUPABASE_ANON_KEY**: Settings > API > Project API keys > anon/public
- **SUPABASE_SERVICE_ROLE_KEY**: Settings > API > Project API keys > service_role (keep secret!)
- **DATABASE_URL**: Settings > Database > Connection string > URI

\`\`\`bash
# Start backend server
npm run dev
\`\`\`

### 3. Frontend Setup

\`\`\`bash
cd frontend

# Install dependencies
npm install

# Copy Supabase environment template
cp .env.supabase.example .env

# Edit .env with your Supabase credentials
\`\`\`

Update `frontend/.env`:

\`\`\`env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001/api
\`\`\`

\`\`\`bash
# Start frontend server
npm run dev
\`\`\`

## Creating Your First Admin User

### Option 1: Via Supabase Dashboard

1. Go to **Authentication > Users** in Supabase dashboard
2. Click **Add User** > **Create new user**
3. Enter email and password
4. After creating, go to **SQL Editor** and run:

\`\`\`sql
UPDATE public.users 
SET role = 'admin', full_name = 'Admin User'
WHERE email = 'your-email@example.com';
\`\`\`

### Option 2: Via API (after backend is running)

\`\`\`bash
curl -X POST http://localhost:3001/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "admin@example.com",
    "password": "securepassword",
    "full_name": "Admin User",
    "role": "admin"
  }'
\`\`\`

## User Roles & Permissions

| Role | Permissions |
|------|------------|
| **Viewer** | Read-only access to deliveries, vehicles, and trips |
| **Delivery Creator** | Create, edit, and delete deliveries |
| **Trip Planner** | Create and manage trips, assign deliveries to vehicles |
| **Admin** | Full access including user management |

## Supabase Benefits

✅ **No Database Setup** - PostgreSQL with PostGIS is pre-configured  
✅ **Built-in Authentication** - Email, OAuth, magic links out of the box  
✅ **Row Level Security** - Database-level security policies  
✅ **Real-time Subscriptions** - Optional real-time updates  
✅ **Automatic API** - Auto-generated REST and GraphQL APIs  
✅ **Dashboard** - Visual database and user management  
✅ **Free Tier** - 500MB database, 50k monthly active users

## Development

### Backend
\`\`\`bash
cd backend
npm run dev     # Start dev server with hot reload
npm run build   # Compile TypeScript
npm start       # Run production build
\`\`\`

### Frontend
\`\`\`bash
cd frontend
npm run dev      # Start dev server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build
\`\`\`

## Deployment

### Backend (API)
- Deploy to Vercel, Railway, or Render
- Set environment variables in hosting platform
- Ensure Supabase service role key is kept secret

### Frontend
- Deploy to Vercel, Netlify, or Cloudflare Pages
- Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- The anon key is safe to expose (protected by RLS)

## Troubleshooting

### "Missing Supabase environment variables"
- Ensure .env files are created from .env.supabase.example
- Verify all Supabase credentials are correct

### Authentication not working
- Check that Email provider is enabled in Supabase dashboard
- Verify frontend URL is added to allowed redirect URLs
- Check browser console for CORS errors

### Database queries failing
- Ensure supabase-schema.sql has been run in SQL Editor
- Check Row Level Security policies are configured
- Verify user has appropriate role assigned

## Future Enhancements

- [ ] Map integration with delivery locations and routes
- [ ] Schedule/Gantt chart visualization
- [ ] Route optimization algorithms
- [ ] Real-time vehicle tracking with Supabase Realtime
- [ ] Mobile app for drivers
- [ ] Push notifications
- [ ] Export reports (PDF, Excel)
- [ ] Integration with external routing APIs

## License

ISC
