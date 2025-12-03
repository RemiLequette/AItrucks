# Architecture Documentation

## Overview

AItrucks is a delivery planning and fleet management system built with a modern React frontend and Supabase backend. The application follows a component-based architecture with clear separation between reusable UI components and business logic.

## Tech Stack

### Frontend
- **React 18.2.0** - UI framework with functional components and hooks
- **TypeScript** - Type-safe development
- **Vite 5.4.21** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **@tanstack/react-table 8.11.2** - Headless table library for data grids
- **react-leaflet** - Map visualization with PostGIS integration
- **i18next** - Internationalization (English/French)
- **lucide-react** - Icon library
- **xlsx** - Excel import/export

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL with PostGIS extension
  - Row Level Security (RLS) policies
  - Real-time subscriptions (optional)
  - Built-in authentication

## Project Structure

```
AItrucks/
├── .github/
│   └── copilot-instructions.md    # Coding standards and conventions
├── database/
│   ├── schema.sql                 # Main database schema
│   └── fix-trip-deliveries-policies.sql  # RLS policy fixes
├── frontend/
│   ├── src/
│   │   ├── components/            # Reusable UI components (business-agnostic)
│   │   │   ├── Table/            # Generic table component
│   │   │   ├── Map/              # Generic map component
│   │   │   └── LanguageSwitcher/ # Language selector
│   │   ├── layout/               # App-specific layout components
│   │   │   └── AppLayout.tsx     # Main app layout with navigation
│   │   ├── pages/                # Business domain pages
│   │   │   ├── Dashboard.tsx     # Overview statistics
│   │   │   ├── Deliveries.tsx    # Delivery management
│   │   │   ├── Vehicles.tsx      # Fleet management
│   │   │   ├── Trips.tsx         # Trip planning
│   │   │   ├── Users.tsx         # User administration
│   │   │   └── Map.tsx           # Map view
│   │   ├── context/              # React context providers
│   │   │   └── AuthContext.tsx   # Authentication state
│   │   ├── services/             # API communication
│   │   │   └── api.ts            # Supabase client & API functions
│   │   ├── i18n/                 # Internationalization
│   │   │   └── config.ts         # i18next configuration
│   │   └── config/               # Configuration files
│   │       └── supabase.ts       # Supabase client initialization
│   └── package.json
├── docs/                          # Documentation
└── README.md
```

## Component Architecture

### Separation of Concerns

The application follows a strict separation between:

1. **Reusable Components** (`src/components/`)
   - Business-agnostic UI components
   - Generic and reusable across any project
   - No domain-specific logic or data structures
   - Examples: Table, Map, Button, Modal
   - Export via barrel files (index.ts)

2. **Layout Components** (`src/layout/`)
   - Application-specific layout structure
   - Can contain business domain knowledge
   - Handles navigation, routing, user info
   - Example: AppLayout with sidebar navigation

3. **Pages** (`src/pages/`)
   - Business domain logic and features
   - Uses reusable components from `src/components/`
   - Contains domain-specific data handling
   - Examples: Deliveries, Vehicles, Trips, Dashboard

### Key Design Patterns

#### Table Component Pattern
- Uses `@tanstack/react-table` for headless table logic
- Generic type parameter: `Table<TData>`
- Column helper functions for common patterns:
  - `createBadgeColumn()` - Status badges
  - `createDateColumn()` - Formatted dates
  - `createNumberColumn()` - Formatted numbers
  - `createActionColumn()` - Action buttons
- Support for sorting, filtering, row selection, drag-and-drop

#### Map Component Pattern
- Uses `react-leaflet` for map rendering
- Parse PostGIS POINT format: `"POINT(lng lat)"`
- Helper functions for creating markers from domain data
- Support for layers, routes, auto-fit bounds

#### API Service Pattern
- All Supabase calls centralized in `src/services/api.ts`
- Consistent error handling with try-catch
- Type-safe responses with TypeScript
- Functions grouped by entity (deliveries, vehicles, trips, users)

## Data Flow

1. **Authentication Flow**
   ```
   Login → Supabase Auth → AuthContext → Protected Routes
   ```

2. **Data Fetching Flow**
   ```
   Page Component → API Service → Supabase Client → PostgreSQL
   ```

3. **State Management**
   - React Context for global state (Auth)
   - Local component state with useState
   - Optional: Supabase real-time subscriptions

## Security Model

### Row Level Security (RLS)
All tables have RLS policies based on user roles:
- `viewer` - Read-only access
- `delivery_creator` - CRUD on deliveries
- `trip_planner` - CRUD on trips and assignments
- `admin` - Full access including user management

### Authentication
- JWT tokens managed by Supabase Auth
- Sessions stored in localStorage
- Role-based access control via `hasRole()` helper
- Protected routes in React Router

## Internationalization

- **Library**: i18next + react-i18next
- **Languages**: English (en), French (fr)
- **Storage**: Browser localStorage
- **Detection**: Browser language with fallback to English
- **Translation Keys**: Flat structure with dot notation
  - `nav.dashboard`, `deliveries.title`, `status.pending`, etc.

## Performance Considerations

- Memoization with `useMemo` for expensive computations
- Callbacks memoized with `useCallback`
- Lazy loading for routes (future enhancement)
- Pagination for large datasets in tables
- Spatial indexing with PostGIS GIST indexes

## Testing Strategy

- **Unit Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright
- **Test Location**: `*.test.tsx` files alongside components
- **Focus**: User behavior over implementation details
- **Mocking**: Supabase calls mocked in tests

## Build & Deployment

### Development
```bash
cd frontend
npm run dev  # Vite dev server on http://localhost:5173
```

### Production Build
```bash
npm run build  # Outputs to frontend/dist/
```

### Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (safe to expose)

## Future Enhancements

- Real-time updates with Supabase subscriptions
- Optimistic UI updates
- Service workers for offline support
- Progressive Web App (PWA) capabilities
- Advanced route optimization algorithms
- Mobile app with React Native
