# AI Trucks - Delivery Planning System

A comprehensive web-based delivery planning and fleet management system built with React, TypeScript, Node.js, Express, and PostgreSQL.

## Features

- 🚚 **Vehicle Management** - Track and manage your fleet of delivery vehicles
- 📦 **Delivery Management** - Create and manage delivery orders with location, scheduling, and capacity details
- 🗺️ **Trip Planning** - Assign deliveries to vehicles with capacity validation
- 👥 **User Management** - Role-based access control (Viewer, Delivery Creator, Trip Planner, Admin)
- 📊 **Dashboard** - Real-time overview of deliveries, vehicles, and trips
- 🔐 **Secure Authentication** - JWT-based authentication with role-based permissions

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- React Router DOM
- Axios
- Leaflet (Maps)
- Lucide React (Icons)

### Backend
- Node.js
- Express
- TypeScript
- PostgreSQL with PostGIS
- JWT Authentication
- Bcrypt

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher) with PostGIS extension
- npm or yarn

## Installation

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd AItrucks
\`\`\`

### 2. Database Setup

Install PostgreSQL and PostGIS, then create a database:

\`\`\`bash
psql -U postgres
CREATE DATABASE aitrucks;
\\c aitrucks
CREATE EXTENSION postgis;
\`\`\`

Run the schema migration:

\`\`\`bash
psql -U postgres -d aitrucks -f backend/src/database/schema.sql
\`\`\`

### 3. Backend Setup

\`\`\`bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your database credentials
# Update DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET

# Run the development server
npm run dev
\`\`\`

The backend will start on `http://localhost:3001`

### 4. Frontend Setup

\`\`\`bash
cd frontend

# Install dependencies
npm install

# Copy environment variables (optional)
cp .env.example .env

# Run the development server
npm run dev
\`\`\`

The frontend will start on `http://localhost:5173`

## Environment Variables

### Backend (.env)

\`\`\`
DATABASE_URL=postgresql://user:password@localhost:5432/aitrucks
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aitrucks
DB_USER=your_db_user
DB_PASSWORD=your_db_password

PORT=3001
NODE_ENV=development

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
\`\`\`

### Frontend (.env)

\`\`\`
VITE_API_URL=http://localhost:3001/api
VITE_MAPBOX_TOKEN=your_mapbox_token_here
\`\`\`

## Initial User Setup

To create the first admin user, you can use the registration endpoint directly:

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

After creating the admin user, you can log in through the web interface and manage other users from the Users page.

## User Roles & Permissions

| Role | Permissions |
|------|------------|
| **Viewer** | Read-only access to deliveries, vehicles, and trips |
| **Delivery Creator** | Create, edit, and delete deliveries |
| **Trip Planner** | Create and manage trips, assign deliveries to vehicles |
| **Admin** | Full access including user management |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (admin only)
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Deliveries
- `GET /api/deliveries` - Get all deliveries
- `GET /api/deliveries/:id` - Get single delivery
- `POST /api/deliveries` - Create delivery (delivery_creator, admin)
- `PUT /api/deliveries/:id` - Update delivery (delivery_creator, trip_planner, admin)
- `DELETE /api/deliveries/:id` - Delete delivery (delivery_creator, admin)

### Vehicles
- `GET /api/vehicles` - Get all vehicles
- `GET /api/vehicles/:id` - Get single vehicle
- `POST /api/vehicles` - Create vehicle (admin)
- `PUT /api/vehicles/:id` - Update vehicle (trip_planner, admin)
- `DELETE /api/vehicles/:id` - Delete vehicle (admin)

### Trips
- `GET /api/trips` - Get all trips
- `GET /api/trips/:id` - Get single trip with deliveries
- `POST /api/trips` - Create trip (trip_planner, admin)
- `PATCH /api/trips/:id/status` - Update trip status (trip_planner, admin)
- `DELETE /api/trips/:id` - Delete trip (trip_planner, admin)

### Users
- `GET /api/users` - Get all users (admin)
- `PATCH /api/users/:id/role` - Update user role (admin)
- `PATCH /api/users/:id/active` - Toggle user active status (admin)

## Database Schema

### Tables
- **users** - User accounts with roles
- **vehicles** - Fleet vehicles with capacity and location
- **deliveries** - Delivery orders with geolocation
- **trips** - Planned routes with assigned vehicles
- **trip_deliveries** - Junction table linking trips and deliveries

All location data uses PostGIS geography type (SRID 4326) for accurate geospatial calculations.

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

## Future Enhancements

- [ ] Map integration with delivery locations and routes
- [ ] Schedule/Gantt chart visualization
- [ ] Route optimization algorithms
- [ ] Real-time vehicle tracking
- [ ] Mobile app for drivers
- [ ] Notifications and alerts
- [ ] Export reports (PDF, Excel)
- [ ] Integration with external routing APIs (Google Maps, MapBox)
- [ ] Historical analytics and insights

## License

ISC

## Support

For issues and questions, please open an issue in the repository.
