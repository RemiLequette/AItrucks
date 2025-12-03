# AI Trucks - Delivery Planning System

A comprehensive web-based delivery planning and fleet management system built with React, TypeScript, and Supabase (PostgreSQL + PostGIS).

## Features

- 🚚 **Vehicle Management** - Track fleet capacity, location, and status
- 📦 **Delivery Management** - Create, assign, and track delivery orders
- 🗺️ **Trip Planning** - Assign deliveries to vehicles with drag-and-drop reordering
- 👥 **User Management** - Role-based access control (Viewer, Delivery Creator, Trip Planner, Admin)
- 📊 **Dashboard** - Real-time overview with statistics
- 🌍 **Internationalization** - Multi-language support (English/French)
- 🔐 **Secure Authentication** - Supabase Auth with Row Level Security
- 📍 **Geospatial** - PostGIS for location tracking and route planning

## Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design, component structure, tech stack
- **[DATABASE.md](docs/DATABASE.md)** - Database schema, relationships, PostGIS usage, RLS policies
- **[BUSINESS-LOGIC.md](docs/BUSINESS-LOGIC.md)** - Business rules, workflows, validation rules, user roles
- **[API.md](docs/API.md)** - API endpoints, request/response formats, authentication
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - Coding standards and conventions

## Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish setting up (~2 minutes)
3. Note your project URL and API keys from Settings > API

### 2. Database Schema Setup

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `database/schema.sql`
3. Paste and run the SQL script to create:
   - Tables (users, vehicles, deliveries, trips, trip_deliveries)
   - PostGIS extension and geography columns
   - Indexes for performance
   - Triggers for timestamp updates
4. Run `database/fix-trip-deliveries-policies.sql` to set up Row Level Security policies

### 3. Frontend Setup

\`\`\`bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your Supabase credentials
\`\`\`

Update `frontend/.env`:

\`\`\`env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
\`\`\`

**Where to find these values:**
- Settings > API > Project URL
- Settings > API > Project API keys > anon/public

\`\`\`bash
# Start frontend dev server
npm run dev  # Opens on http://localhost:5173
\`\`\`

## Creating Your First Admin User

1. Go to **Authentication > Users** in Supabase dashboard
2. Click **Add User** > **Create new user**
3. Enter email and password
4. After creating, go to **SQL Editor** and run:

\`\`\`sql
UPDATE public.users 
SET role = 'admin', full_name = 'Admin User'
WHERE email = 'your-email@example.com';
\`\`\`

## User Roles & Permissions

| Role | Permissions |
|------|------------|
| **Viewer** | Read-only access |
| **Delivery Creator** | Create, edit, delete deliveries + Excel import/export |
| **Trip Planner** | Create trips, assign deliveries, reorder via drag-and-drop |
| **Admin** | Full access including user management and trip deletion |

See [BUSINESS-LOGIC.md](docs/BUSINESS-LOGIC.md) for detailed role permissions.

## Key Features

### Delivery Management
- Create deliveries with customer info, address, weight, volume
- Geocode addresses to GPS coordinates
- Import/export via Excel
- Status tracking: pending → assigned → in_transit → delivered

### Trip Planning
- Assign deliveries to vehicles with capacity validation
- Drag-and-drop reordering of deliveries within trips
- Visual indication of capacity usage
- One delivery per trip enforcement

### Map Visualization
- Interactive map with delivery and vehicle locations
- Layer toggles (deliveries, vehicles, routes)
- PostGIS-powered geospatial queries

### Internationalization
- English and French language support
- Click-based language switcher in sidebar
- All pages, dashboard, and UI elements translated

## Development
\`\`\`bash
cd frontend
npm run dev      # Vite dev server with HMR
npm run build    # Build for production
npm run preview  # Preview production build
npm test         # Run Vitest tests
\`\`\`

## Testing

- **Unit Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright
- Run tests: `npm test`
- See [TESTING.md](TESTING.md) for details

## Deployment
- Deploy to Vercel, Netlify, or Cloudflare Pages
- Set environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- The anon key is safe to expose (protected by Row Level Security)

## Project Structure

\`\`\`
AItrucks/
├── docs/                    # Comprehensive documentation
│   ├── ARCHITECTURE.md      # System design and tech stack
│   ├── DATABASE.md          # Schema, relationships, PostGIS
│   ├── BUSINESS-LOGIC.md    # Business rules and workflows
│   └── API.md               # API endpoints and usage
├── .github/
│   └── copilot-instructions.md  # Coding standards
├── database/
│   ├── schema.sql           # Main database schema
│   └── fix-trip-deliveries-policies.sql  # RLS policies
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── layout/          # App layout (navigation, sidebar)
│   │   ├── pages/           # Business pages (Deliveries, Trips, etc.)
│   │   ├── services/        # API integration (api.ts)
│   │   ├── context/         # React context (Auth)
│   │   └── i18n/            # Internationalization
│   └── package.json
└── README.md
\`\`\`

## Architecture Highlights

- **Component Separation**: Reusable components vs. business logic
- **Type Safety**: Full TypeScript coverage
- **Security**: Row Level Security policies in database
- **Performance**: PostGIS spatial indexes, memoization
- **Scalability**: Stateless frontend, Supabase backend

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

## Troubleshooting

## License

ISC
