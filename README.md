# 🎯 LifePlanner - Productivity Platform

A comprehensive productivity application built with a robust PostgreSQL database architecture, featuring advanced task management, calendar integration, focus tracking, and real-time collaboration capabilities.

## 🗄️ Database Architecture

### Core Database Technologies
- **PostgreSQL** - Primary relational database
- **Prisma ORM** - Type-safe database client and schema management
- **Database Migrations** - Version-controlled schema evolution
- **Connection Pooling** - Optimized database performance

### 📊 Database Schema Overview

Our database is designed around a user-centric architecture with comprehensive relationship mapping:

#### 🔐 User Management
```sql
Users → Boards → Lists → Tasks
     → Calendars → Events
     → FocusSessions
     → Shares (Collaboration)
     → Streaks (Gamification)
```

#### 📋 Core Entities

**Users Table**
- Primary entity managing authentication and user profiles
- Supports profile pictures, status tracking, and login history
- Central hub for all user-related data relationships

**Boards & Lists**
- Hierarchical task organization (Board → List → Task)
- Archive functionality for data retention
- User ownership with cascade deletion policies

**Tasks System**
- Rich task metadata (priority, status, due dates, completion tracking)
- Subtask support through TaskSteps
- Integration with calendar events and focus sessions
- Repeating task patterns with flexible scheduling

**Calendar Integration**
- Multiple calendar support per user
- Event-task linking for comprehensive time management
- Reminder and alarm systems

**Focus Sessions**
- Time tracking with session completion analytics
- Task association for productivity insights
- Duration and completion metrics

### 🏗️ Database Operations

#### Performance Optimizations
- **Indexed Relationships** - Foreign keys optimized for query performance
- **Cascade Deletion** - Automatic cleanup of related records
- **Soft Deletes** - Archive functionality preserves data integrity
- **Query Optimization** - Prisma's type-safe query building

#### Data Integrity
- **ACID Compliance** - PostgreSQL ensures transaction reliability
- **Referential Integrity** - Foreign key constraints prevent orphaned records
- **Data Validation** - Zod schemas validate data at application level
- **Migration Safety** - Version-controlled schema changes

## 🛠️ Project Structure

```
lifeplanner/
├── backend/                     # Node.js + Express API Server
│   ├── src/
│   │   ├── controllers/         # API endpoint handlers
│   │   ├── routes/              # Express route definitions
│   │   ├── middleware/          # Authentication & validation
│   │   ├── services/            # Business logic & schedulers
│   │   ├── types/               # TypeScript definitions
│   │   └── utils/               # Helper functions
│   ├── prisma/                  # Database schema & migrations
│   ├── uploads/avatars/         # User profile pictures
│   └── package.json             # Backend dependencies
│
└── frontend/                    # Next.js 15 + React 19 App
    ├── src/
    │   ├── app/                 # Next.js app router pages
    │   │   ├── (auth)/          # Authentication pages
    │   │   └── (dashboard)/     # Protected dashboard routes
    │   ├── components/          # Reusable UI components
    │   │   ├── auth/            # Authentication components
    │   │   ├── dashboard/       # Dashboard widgets
    │   │   ├── tasks/           # Task management UI
    │   │   ├── calendar/        # Calendar components
    │   │   ├── focus/           # Focus session tracker
    │   │   └── analytics/       # Charts & insights
    │   └── lib/
    │       ├── stores/          # Zustand state management
    │       ├── api/             # API client & requests
    │       └── types/           # Shared TypeScript types
    └── package.json             # Frontend dependencies
```

## 🛠️ Technical Stack

### Backend Architecture
```javascript
Node.js + Express.js
├── Prisma ORM (Database Layer)
├── JWT Authentication
├── Express Validator (Input Validation)
├── Socket.IO (Real-time Features)
└── PostgreSQL Database
```

### Frontend State Management
```javascript
Next.js 15 + React 19
├── Zustand (Global State)
├── Immer (Immutable Updates)
├── React Hook Form (Form Management)
└── TailwindCSS (Styling)
```

### 📊 State Management Architecture

Our application uses **Zustand** with **Immer** for predictable state management across six specialized stores:

#### 🔐 Authentication Store (`useAuthStore`)
- **Persistent Authentication** - Tokens stored with automatic refresh
- **User Profile Management** - Avatar uploads, profile updates
- **Session Management** - Login/logout with proper cleanup
- **Rehydration Logic** - Seamless state restoration on app load

```typescript
interface AuthState {
  user: UserWithStats | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isRehydrated: boolean;
}
```

#### 📋 Board Management (`useBoardStore`)
- **Hierarchical Data** - Boards → Lists → Tasks relationships
- **Real-time Updates** - Optimistic UI updates with error handling
- **Archive System** - Soft delete functionality

#### 📅 Calendar Integration (`useCalendarStore`)
- **Multi-view Support** - Month, week, day, agenda views
- **Event Management** - CRUD operations with task linking
- **Navigation Logic** - Date-aware view transitions

#### ⏱️ Focus Tracking (`useFocusStore`)
- **Active Session Management** - Real-time timer with pause/resume
- **Session Analytics** - Statistics and today's summary
- **Completion Tracking** - Automatic session end detection

#### ✅ Task Management (`useTaskStore`)
- **Advanced Filtering** - Priority, status, date-based filters
- **Pagination Support** - Efficient large dataset handling
- **Today's Overview** - Dashboard integration

#### 🎨 UI State (`useUIStore`)
- **Responsive Layout** - Mobile/desktop sidebar management
- **Modal System** - Centralized modal state
- **Theme Management** - Light/dark/system theme support
- **Notification System** - Toast-style user feedback

## 🚀 Database Setup & Development

### Prerequisites
```bash
Node.js >= 18.0.0
PostgreSQL >= 13
```

### Installation

1. **Clone and Setup**
```bash
git clone
cd lifeplanner
```

2. **Backend Setup**
```bash
cd backend
npm install

# Create .env file
DATABASE_URL="postgresql://username:password@localhost:5432/lifeplanner"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
```

3. **Database Migration**
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Run migrations (production)
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

4. **Frontend Setup**
```bash
cd ../frontend
npm install
```

5. **Development Servers**
```bash
# Backend (from /backend directory)
npm run dev

# Frontend (from /frontend directory, separate terminal)
npm run dev
```

### 🔧 Database Management Commands

```bash
# Navigate to backend directory first
cd backend

# View database in browser
npm run db:studio

# Reset database
npx prisma migrate reset

# Generate new migration
npx prisma migrate dev --name migration_name

# Deploy migrations to production
npx prisma migrate deploy
```

## 📈 Database Analytics & Insights

### Built-in Analytics Tables
- **User Stats** - Task completion rates, focus session metrics
- **Productivity Insights** - Weekly/monthly performance tracking
- **Streak Tracking** - Gamification metrics for user engagement
- **Usage Patterns** - Login frequency, feature utilization

### Dashboard Metrics
The dashboard store aggregates data from multiple tables:
- **Today's Overview** - Active tasks, upcoming events, focus time
- **Productivity Insights** - Completion rates, time spent per category
- **Performance Trends** - Historical data visualization

## 🔒 Security & Data Protection

### Authentication Security
- **JWT Tokens** - Secure, stateless authentication
- **Refresh Tokens** - Automatic session renewal
- **Password Hashing** - bcryptjs with salt rounds
- **Rate Limiting** - Express rate limiter for API protection

### Data Privacy
- **User Isolation** - All data scoped to user ownership
- **Sharing Controls** - Granular permission system
- **Data Encryption** - Sensitive data encrypted at rest
- **GDPR Compliance** - User data export/deletion capabilities

## 🤝 Collaboration Features

### Database-Driven Sharing
```sql
-- Example: Share a board with read access
INSERT INTO shares (
  resourceType, resourceId, ownerUserId, 
  sharedWithUserId, permissionLevel
) VALUES (
  'board', 'board_id', 'owner_id', 
  'recipient_id', 'read'
);
```

### Permission Levels
- **Read** - View-only access to shared resources
- **Write** - Edit shared content
- **Admin** - Full control including sharing permissions

## 📊 Performance & Monitoring

### Database Performance
- **Connection Pooling** - Prisma connection management
- **Query Optimization** - Indexed foreign keys and frequent queries
- **Lazy Loading** - Efficient data fetching patterns
- **Caching Strategy** - Frontend state caching with Zustand persistence

### Monitoring
- **Error Tracking** - Comprehensive error logging
- **Performance Metrics** - Database query performance monitoring
- **User Analytics** - Feature usage and engagement tracking

## 🔧 API Architecture

### RESTful Endpoints
```
/api/auth      - Authentication & user management
/api/boards    - Board and list operations
/api/tasks     - Task CRUD and filtering
/api/calendar  - Calendar and event management
/api/focus     - Focus session tracking
/api/dashboard - Analytics and insights
```

### Real-time Features
- **Socket.IO Integration** - Live collaboration updates
- **Event Broadcasting** - Cross-user notifications
- **Presence System** - Online user tracking

## 📄 License

MIT License - See LICENSE file for details

---

*Built with ❤️ using PostgreSQL, Prisma, and modern web technologies*
