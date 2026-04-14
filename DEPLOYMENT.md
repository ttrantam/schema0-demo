# Fitness Lover - Fitness Platform

A complete fitness web application connecting personal trainers and fitness users, built on the Schema0 platform.

**Live URL:** https://c1353ec--br-lively-poetry-aeqjkxl9.schema0.com

## Features Built

### 1. **Personal Trainer Management**
- Trainer profiles with specializations, certifications, and ratings
- Hourly rates and experience levels
- Professional bio and profile pictures
- Full CRUD operations

### 2. **Training Sessions**
- Schedule management with day/time selections
- Session types (one-on-one or group)
- Participant capacity tracking
- Pricing per session
- Session status management (active, inactive, full)

### 3. **Booking System**
- Users can book training sessions
- Booking status tracking (pending, confirmed, completed, cancelled)
- Notes and comments on bookings
- Track all reservations by user or trainer

### 4. **User Management**
- User authentication via Schema0 auth
- User profile management
- Session management

## Architecture

### Database Layer (packages/db/)
- **trainers.ts** - Trainer profile schema with Zod validation
- **sessions.ts** - Training session schema
- **bookings.ts** - Booking records schema
- Exported schemas available to API and web layers

### API Layer (packages/api/)
- **trainers.ts** - REST endpoints for trainer CRUD
- **sessions.ts** - REST endpoints for session management
- **bookings.ts** - REST endpoints for booking operations
- Built with ORPC (Object-RPC) for type-safe API calls
- Protected procedures requiring authentication

### Frontend (apps/web/)
- **_auth.trainers.tsx** - Trainer listing page with card view
- **_auth.sessions.tsx** - Sessions directory with schedule info
- **_auth.bookings.tsx** - User's booking management page
- **Built-in collections** - TanStack DB collections for data synchronization
- Responsive UI with Tailwind CSS
- Real-time data updates

## Tech Stack

- **Frontend:** React Router v7 + TanStack React Query
- **Backend:** Hono + oRPC API
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Schema0 Auth
- **UI Components:** shadcn/ui
- **Runtime:** Bun
- **Deployment:** Schema0 Platform

## Getting Started

1. Navigate to the live URL to access the application
2. Log in with your Schema0 credentials
3. Explore the sidebar navigation:
   - **Home** - Dashboard overview
   - **Trainers** - Browse and manage trainer profiles
   - **Sessions** - View and create training sessions
   - **Bookings** - Manage your training reservations
   - **Users** - Manage user accounts
   - **Files** - File management
   - **Integrations** - Integration settings

## Project Structure

```
fitness-lover/
├── .schema0/
│   └── config.json              # Schema0 configuration
├── apps/
│   └── web/                     # React Router web app
│       ├── src/
│       │   ├── routes/          # Page components
│       │   ├── components/      # UI components
│       │   └── query-collections/  # TanStack DB collections
├── packages/
│   ├── db/                      # Database schemas
│   │   └── src/schema/ 
│   │       ├── trainers.ts
│   │       ├── sessions.ts
│   │       └── bookings.ts
│   ├── api/                     # API routers
│   │   └── src/routers/
│   │       ├── trainers.ts
│   │       ├── sessions.ts
│   │       └── bookings.ts
│   └── auth/                    # Authentication
```

## Development Commands

```bash
# Build the application
bun run build

# Deploy to Schema0
bun schema0 deploy

# Check project health
bun schema0 doctor

# Development workflow
bun run dev  # (starts Expo dev server for mobile, if available)
```

## API Endpoints

All endpoints are protected and require authentication.

### Trainers
- `GET /trainers` - List all trainers
- `GET /trainers/:id` - Get trainer details
- `POST /trainers` - Create new trainer
- `PATCH /trainers/:id` - Update trainer
- `DELETE /trainers/:id` - Delete trainer

### Sessions
- `GET /sessions` - List all sessions
- `GET /sessions/:id` - Get session details
- `GET /sessions?trainerId=:trainerId` - Get sessions by trainer
- `POST /sessions` - Create new session
- `PATCH /sessions/:id` - Update session
- `DELETE /sessions/:id` - Delete session

### Bookings
- `GET /bookings` - List all bookings
- `GET /bookings/:id` - Get booking details
- `GET /bookings?userId=:userId` - Get user's bookings
- `GET /bookings?trainerId=:trainerId` - Get trainer's bookings
- `POST /bookings` - Create new booking
- `PATCH /bookings/:id` - Update booking status
- `DELETE /bookings/:id` - Cancel booking

## Next Steps

To extend this application:

1. **Add Reviews & Ratings** - Allow users to rate trainers and sessions
2. **Payment Integration** - Add Stripe or payment processing
3. **Notifications** - Email/SMS for booking confirmations
4. **Analytics** - Track popular trainers and sessions
5. **Mobile App** - React Native app using Expo (optional platform)
6. **Advanced Scheduling** - Calendar integration and recurring sessions
7. **Availability Management** - Trainers can set availability windows

## Support

For deployment and platform-specific issues, visit:
- Schema0 Documentation: https://schema0.dev
- GitHub Repository: The project is stored in your workspace

---

**Deployment Date:** April 14, 2026
**Status:** ✅ Live and Running
