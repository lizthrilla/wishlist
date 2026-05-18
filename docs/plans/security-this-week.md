# Security Remediation — This Week

## Summary

Address the three highest-risk security findings from the May 2026 security audit. All three are exploitable with minimal effort and should be fixed before any further feature work.

## Background

Security audit identified 5 High, 4 Medium findings. The three issues below are prioritised for immediate resolution because they are:
- Exploitable without authentication (DoS via password length, brute-force via no rate limiting)
- Exploitable on a staging server by any attacker who knows a target email (reset token leak)

---

## Task 1 — Add `@MaxLength` to all password fields (CPU/memory DoS)

**Severity:** High  
**Why now:** A single unauthenticated HTTP request with a multi-megabyte `password` field will block the Node.js event loop for seconds. `scrypt` is memory-hard and processes the full input length with no upper bound enforced.

### Files to change

- `apps/api/src/auth/dto/register.dto.ts`
- `apps/api/src/auth/dto/login.dto.ts`
- `apps/api/src/auth/dto/reset-password.dto.ts`

### Changes

Add `@MaxLength(72)` and bump `@MinLength` from `6` to `8` on all `password` fields. 72 bytes is the standard scrypt/bcrypt effective key length; anything beyond it is truncated. Also add `MaxLength` to the imports.

```typescript
// register.dto.ts, login.dto.ts, reset-password.dto.ts
import { IsString, MinLength, MaxLength } from 'class-validator';

@IsString()
@MinLength(8)
@MaxLength(72)
password: string;
```

Also add `@MaxLength(254)` to all `email` fields (RFC 5321 limit) and `@MaxLength(100)` to `name` in `RegisterDto`.

### Verification

- Unit test: POST `/api/auth/login` with a 100-char password → 200 (or 401)
- Unit test: POST `/api/auth/login` with a 73-char password → 400 Bad Request
- Existing auth service tests must still pass

---

## Task 2 — Install `@nestjs/throttler` and rate-limit auth endpoints

**Severity:** High  
**Why now:** With no rate limiting, an attacker can brute-force the 6-character (post-fix: 8-character) password keyspace at the full speed of the server. The `/forgot-password` endpoint is also abusable for user enumeration and token farming on non-production environments.

### Files to change

- `apps/api/package.json` (dependency)
- `apps/api/src/app.module.ts`
- `apps/api/src/auth/auth.controller.ts`

### Changes

```bash
cd apps/api && npm install @nestjs/throttler
```

Configure a global default (60 requests per minute) and a tighter per-route override on all auth endpoints (5 requests per minute):

```typescript
// app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    // ... existing modules
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // ... existing providers
  ],
})
```

```typescript
// auth.controller.ts — add to login, register, forgotPassword, resetPassword
import { Throttle } from '@nestjs/throttler';

@Throttle({ default: { limit: 5, ttl: 60_000 } })
@Post('login')
async login(...) { ... }

@Throttle({ default: { limit: 5, ttl: 60_000 } })
@Post('register')
async register(...) { ... }

@Throttle({ default: { limit: 5, ttl: 60_000 } })
@Post('forgot-password')
async forgotPassword(...) { ... }

@Throttle({ default: { limit: 5, ttl: 60_000 } })
@Post('reset-password')
async resetPassword(...) { ... }
```

### Verification

- E2E or integration test: 6 rapid requests to `/api/auth/login` → 6th returns 429 Too Many Requests
- Existing auth controller tests must still pass (mock or skip throttler in test module using `ThrottlerModule.forRoot([{ ttl: 0, limit: 0 }])`)

---

## Task 3 — Gate `resetToken` dev leak behind explicit env var

**Severity:** High (Medium on staging, High if staging is internet-accessible)  
**Why now:** `NODE_ENV !== 'production'` leaks the raw password reset token in the HTTP response body. Any misconfigured staging or QA server reachable from the internet allows account takeover for any known email address — no other credentials required.

### Files to change

- `apps/api/src/auth/auth.service.ts`
- `apps/api/.env.example` (new or updated)

### Changes

Replace the `NODE_ENV` check with an explicit `DEV_RETURN_RESET_TOKEN` opt-in:

```typescript
// auth.service.ts — forgotPassword return
return {
  message: 'If an account exists for that email, a reset token has been generated.',
  ...(process.env.DEV_RETURN_RESET_TOKEN === 'true' && {
    _devOnlyResetToken: rawToken,
    expiresAt: new Date(Date.now() + PASSWORD_RESET_DURATION_MS).toISOString(),
  }),
};
```

The `_devOnly` prefix makes the intent visually obvious in API responses and API client code.

Update `apps/api/.env.example` (create if missing):

```dotenv
# Set to 'true' ONLY in local development to return reset tokens in the API response.
# NEVER set this on staging or production.
DEV_RETURN_RESET_TOKEN=true
```

Update `apps/web/src/api/auth.ts` — rename `resetToken` to `_devOnlyResetToken` in `ForgotPasswordResponse`, and update `App.tsx` where it reads `response.resetToken`.

### Verification

- Test: `DEV_RETURN_RESET_TOKEN=true` → response includes `_devOnlyResetToken`
- Test: `DEV_RETURN_RESET_TOKEN` unset → response does NOT include the token
- Test: `NODE_ENV=production` with `DEV_RETURN_RESET_TOKEN=true` → still returns token (explicit opt-in wins; caller is responsible — document this clearly)
- Existing auth service spec must pass with updated field name

---

## Acceptance Criteria

- [ ] POST `/api/auth/login` with a 73+ character password returns 400
- [ ] POST `/api/auth/login` 6 times in under 60 seconds returns 429 on the 6th
- [ ] Staging server with `DEV_RETURN_RESET_TOKEN` unset does NOT return reset tokens
- [ ] All existing tests pass (97/97)
