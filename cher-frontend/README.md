# CRM Frontend Documentation

## Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Features](#features)
- [Authentication](#authentication)
- [API Integration](#api-integration)
- [Routing](#routing)
- [Components](#components)
- [Styling](#styling)
- [Development](#development)

## Overview

A modern Customer Relationship Management (CRM) system built with React, TypeScript, and Tailwind CSS. The application provides comprehensive lead management, activity tracking, analytics, and user authentication.

## Tech Stack

- **Framework**: React 18.3.1
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Routing**: React Router DOM v6
- **Form Handling**: React Hook Form + Zod
- **State Management**: React Context API
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: Sonner (Toast)

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or bun

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd <project-name>

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun run dev
```

The application will be available at `http://localhost:8081`

### Build for Production

```bash
npm run build
# or
bun run build
```

## Project Structure

```
├── public/
│   ├── robots.txt
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── ProtectedRoute.tsx
│   │   ├── Sidebar.tsx
│   │   └── StatusBadge.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication context
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── api.ts           # API service layer (currently mock)
│   │   └── utils.ts         # Utility functions
│   ├── pages/
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── Leads.tsx        # Leads list
│   │   ├── LeadDetail.tsx   # Individual lead view
│   │   ├── LeadForm.tsx     # Create/Edit lead form
│   │   ├── Analytics.tsx    # Analytics dashboard
│   │   ├── Login.tsx        # Login page
│   │   ├── Register.tsx     # Registration page
│   │   └── NotFound.tsx     # 404 page
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── index.html
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

## Features

### 1. Dashboard
- Overview statistics (total leads, active leads, conversion rate)
- Lead status distribution chart
- Lead source breakdown chart
- Recent activities feed
- Quick action buttons

### 2. Lead Management
- Create, read, update, delete leads
- Search and filter capabilities
- Status-based filtering (new, contacted, qualified, converted)
- Pagination support
- Lead details view with full information

### 3. Activity Tracking
- Log activities for each lead (calls, emails, meetings, notes)
- Activity timeline view
- Activity type categorization
- Timestamp tracking

### 4. Analytics
- Visual charts for lead metrics
- Source-based analytics
- Status distribution
- Conversion tracking

### 5. Authentication
- User registration
- User login
- Session management via localStorage
- Protected routes
- Logout functionality

## Authentication

The application uses a custom `AuthContext` for managing authentication state.

### AuthContext API

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}
```

### Usage

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  // Use authentication state
}
```

### Protected Routes

Routes are protected using the `ProtectedRoute` component:

```typescript
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

## API Integration

### Current Implementation (Mock)

The application currently uses mock data defined in `src/lib/api.ts`. All API calls are simulated with delays to mimic real API behavior.

### API Service Functions

#### Authentication
- `login(username, password)` - User login
- `register(data)` - User registration

#### Lead Management
- `getLeads(params)` - Fetch leads with filtering/pagination
- `getLead(id)` - Fetch single lead
- `createLead(data)` - Create new lead
- `updateLead(id, data)` - Update existing lead
- `deleteLead(id)` - Delete lead

#### Activity Management
- `getLeadActivities(leadId)` - Fetch lead activities
- `createActivity(leadId, data)` - Create new activity

#### Dashboard
- `getDashboardStats()` - Fetch dashboard statistics

### Migrating to Real Backend

To replace mock API calls with real backend:

1. **Update API base URL**
   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_URL;
   ```

2. **Replace mock functions with fetch calls**
   ```typescript
   export async function getLeads(params?: GetLeadsParams) {
     const response = await fetch(`${API_BASE_URL}/leads`, {
       headers: {
         'Authorization': `Bearer ${token}`,
       },
     });
     return response.json();
   }
   ```

3. **Add error handling**
4. **Configure environment variables**

## Routing

The application uses React Router v6 with the following routes:

```typescript
/                    # Redirects to /dashboard
/login               # Public - Login page
/register            # Public - Registration page
/dashboard           # Protected - Main dashboard
/leads               # Protected - Leads list
/leads/new           # Protected - Create lead form
/leads/:id           # Protected - Lead details
/leads/:id/edit      # Protected - Edit lead form
/analytics           # Protected - Analytics dashboard
/*                   # 404 - Not found page
```

## Components

### UI Components (shadcn/ui)

Located in `src/components/ui/`, includes:
- Button, Input, Select, Checkbox, Switch
- Card, Badge, Avatar
- Dialog, Sheet, Popover, Tooltip
- Table, Tabs, Accordion
- Form components with React Hook Form integration
- Toast notifications
- And many more...

### Custom Components

#### Sidebar
Navigation sidebar with links to all main sections.

#### StatusBadge
Displays lead status with color-coded badges:
- New (blue)
- Contacted (yellow)
- Qualified (purple)
- Converted (green)

#### ProtectedRoute
Wrapper component that redirects unauthenticated users to login.

## Styling

### Design System

The project uses a semantic token-based design system defined in:
- `src/index.css` - CSS variables and global styles
- `tailwind.config.ts` - Tailwind configuration

### Theme Colors

All colors use HSL format and semantic tokens:
```css
--background
--foreground
--primary
--secondary
--muted
--accent
--destructive
--border
--input
--ring
```

### Best Practices

1. **Always use semantic tokens** instead of direct colors
2. **Use the cn() utility** for conditional classes
3. **Follow the component variant pattern** for customization
4. **Responsive by default** - mobile-first approach

## Development

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for React and TypeScript
- **Imports**: Use `@/` alias for src directory

### Adding New Features

1. Create new page components in `src/pages/`
2. Add routes in `src/App.tsx`
3. Update API functions in `src/lib/api.ts`
4. Add UI components from shadcn/ui as needed
5. Follow existing patterns for consistency

### Form Handling

Forms use React Hook Form + Zod validation:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  field: z.string().min(1, 'Required'),
});

const form = useForm({
  resolver: zodResolver(schema),
});
```

### Toast Notifications

Use the `useToast` hook for user feedback:

```typescript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

toast({
  title: "Success",
  description: "Operation completed",
});
```

## Environment Variables

When connecting to a real backend, create a `.env` file:

```
API_URL
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)