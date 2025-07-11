# Web Application Architecture

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fast, modern)
- **State Management**: Redux Toolkit
- **UI Library**: Material-UI v5
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Forms**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (primary)
- **Cache**: Redis
- **ORM**: Prisma
- **Authentication**: JWT with refresh tokens
- **API Documentation**: OpenAPI/Swagger

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose (dev), Kubernetes (prod)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana

## Project Structure

```
project-root/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── services/         # Business logic
│   │   ├── models/           # Database models
│   │   ├── middleware/       # Express middleware
│   │   ├── utils/            # Helper functions
│   │   ├── types/            # TypeScript types
│   │   └── index.ts          # Entry point
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Route pages
│   │   ├── hooks/           # Custom hooks
│   │   ├── store/           # Redux store
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   └── main.tsx         # Entry point
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── shared/
│   └── types/               # Shared TypeScript types
├── docker/
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
├── docker-compose.yml
├── .env.example
└── Makefile
```

## Development Workflow

### Phase 1: Initial Setup
1. Create basic Express server with TypeScript
2. Set up PostgreSQL with Prisma
3. Create React app with Vite
4. Configure Docker Compose
5. Implement basic CRUD endpoints

### Phase 2: Core Features
1. Authentication system (JWT)
2. User management
3. Basic UI components
4. Redux store setup
5. API integration

### Phase 3: Production Ready
1. Error handling & logging
2. Input validation
3. Security headers
4. Rate limiting
5. Testing (Jest + React Testing Library)
6. CI/CD pipeline

## Code Standards

### Backend Standards
```typescript
/**
 * @file controllers/user.controller.ts
 * @description User management endpoints
 */

import { Request, Response } from 'express';
import { userService } from '../services/user.service';

/**
 * Get all users with pagination
 * @route GET /api/users
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const users = await userService.findAll({ page, limit });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

### Frontend Standards
```typescript
/**
 * @file components/UserList.tsx
 * @description Display paginated list of users
 */

import React from 'react';
import { useAppSelector, useAppDispatch } from '../hooks/redux';

interface UserListProps {
  title?: string;
}

/**
 * UserList component with real-time updates
 * @param {UserListProps} props - Component props
 * @returns {JSX.Element} Rendered user list
 */
export const UserList: React.FC<UserListProps> = ({ title = 'Users' }) => {
  const dispatch = useAppDispatch();
  const { users, loading } = useAppSelector(state => state.users);
  
  // Component implementation
};
```

## Security Checklist

- [ ] HTTPS only (Let's Encrypt)
- [ ] Helmet.js for security headers
- [ ] Input validation (Zod schemas)
- [ ] SQL injection prevention (Prisma)
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Rate limiting
- [ ] Secure session management
- [ ] Environment variable validation

## API Design Patterns

### RESTful Endpoints
```
GET    /api/resources          # List with pagination
GET    /api/resources/:id      # Get single resource
POST   /api/resources          # Create new resource
PUT    /api/resources/:id      # Update resource
DELETE /api/resources/:id      # Delete resource
```

### Response Format
```typescript
// Success response
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "totalPages": 10,
    "totalItems": 100
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { ... }
  }
}
```

## Common Commands

```bash
# Development
make dev              # Start all services
make backend-logs     # View backend logs
make frontend-logs    # View frontend logs
make db-migrate      # Run migrations

# Testing
make test            # Run all tests
make test-backend    # Backend tests only
make test-e2e        # End-to-end tests

# Production
make build           # Build for production
make deploy          # Deploy to Kubernetes
```

## Performance Optimization

1. **Backend**:
   - Database query optimization
   - Redis caching strategy
   - Connection pooling
   - Lazy loading

2. **Frontend**:
   - Code splitting
   - Lazy loading routes
   - Image optimization
   - Service Worker for offline

## Deployment Strategy

1. Build Docker images
2. Run tests in CI/CD
3. Deploy to staging
4. Run E2E tests
5. Deploy to production
6. Monitor metrics