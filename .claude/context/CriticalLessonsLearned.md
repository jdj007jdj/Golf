# Critical Lessons Learned - Golf Project

## CRITICAL: Express Validator vs Joi Validation Middleware Incompatibility

**Date**: 2025-01-13
**Impact**: HIGH - Causes POST/PUT requests to hang indefinitely
**Root Cause**: Mixing incompatible validation libraries

### The Problem
When using `express-validator` for route validation but importing `validateRequest` from a Joi-based middleware, the middleware chain hangs because:
1. `express-validator` uses a different validation pattern than Joi
2. The Joi middleware expects schemas in a specific format
3. The middleware never calls `next()` and doesn't send a response

### Symptoms
- GET requests work fine (no validation)
- POST requests timeout after 10 seconds
- PUT requests timeout after 10 seconds
- Backend logs show request received but no response sent
- Client shows "AbortError: Aborted" after timeout

### The Fix
Create a proper express-validator compatible middleware:

```typescript
// middleware/expressValidatorMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  next();
};
```

### Prevention Guidelines
1. **NEVER mix validation libraries** - if using express-validator, use it consistently
2. **Check middleware compatibility** - ensure all middleware in chain use same patterns
3. **Test POST/PUT endpoints early** - don't assume they work if GET works
4. **Add logging to middleware** - helps identify where requests hang
5. **Use consistent validation patterns** across the entire backend

### Related Issues
- Initial issue: POST /rounds hanging when creating new rounds
- Second issue: POST /rounds/:id/scores hanging when saving scores
- Third issue: PUT /rounds/:id/complete hanging when completing rounds
- All were the same root cause: incompatible validation middleware

### Testing Checklist
When adding new routes, always test:
- [ ] GET endpoints work
- [ ] POST endpoints work (not just that they're called)
- [ ] PUT endpoints work
- [ ] DELETE endpoints work
- [ ] Validation errors return proper responses
- [ ] Valid requests complete successfully

### Code Review Checklist
Before committing route changes:
- [ ] Validation library imports match middleware
- [ ] All validators are from same library
- [ ] Middleware chain is compatible
- [ ] Error responses follow consistent format
- [ ] Logging added for debugging

---

## WSL2 Networking with React Native

**Date**: 2025-01-13
**Impact**: MEDIUM - Prevents mobile app from connecting to backend

### The Problem
React Native on physical Android device cannot connect to backend running in WSL2 due to NAT networking.

### The Solution
Use Windows port forwarding:
1. Backend binds to `0.0.0.0:3000` (not localhost)
2. Windows forwards port: `netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$(wsl hostname -I)`
3. Mobile app uses Windows IP: `http://192.168.0.123:3000`

---

## React Native 0.76.x Breaking Changes

**Date**: 2025-01-13
**Impact**: HIGH - Prevents app from building

### Key Issues
1. **Kotlin required** (not Java) for Android
2. **New architecture** by default
3. **Specific version requirements** for all dependencies

### Prevention
- Always check React Native upgrade helper
- Test on fresh project first
- Keep dependencies in sync