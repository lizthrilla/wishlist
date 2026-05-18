# Security Remediation — This Sprint

## Summary

Four security improvements to complete this sprint after the "this week" critical fixes are merged. These require authenticated access to exploit or are defense-in-depth improvements, but all are well-scoped and should not block feature delivery.

## Prerequisites

- `security-this-week.md` tasks are merged to main
- `@nestjs/throttler` is installed (from Task 2 of this week's plan)

---

## Task 1 — Run `npm audit fix` and add CI audit gate

**Severity:** High (28 known CVEs: 1 Critical, 16 High)  
**Source:** `npm audit` at repo root

### What's affected

- 1 Critical: Handlebars.js (prototype pollution / JS injection — in dev toolchain)
- 16 High: Vite (path traversal on dev server), serialize-javascript (RCE in build toolchain)
- 11 Moderate: yaml (stack overflow via deeply nested input)

### Changes

```bash
# From repo root
npm audit fix

# If any vulnerabilities require breaking changes:
npm audit fix --force  # review each change before accepting

# Verify after fix
npm audit --audit-level=moderate
```

Add an audit gate to CI (update `.github/workflows/` or equivalent):

```yaml
- name: Audit dependencies
  run: npm audit --audit-level=high
  working-directory: .
```

This fails the build if any High or Critical CVE is introduced in future PRs.

### Verification

- `npm audit --audit-level=high` exits 0 after fix
- All 97 tests still pass after dependency updates
- Dev server (`npm run dev`) still works after Vite upgrade

---

## Task 2 — Install Helmet and enable HTTP security headers

**Severity:** High (no CSP, HSTS, X-Frame-Options on any response)  
**Source:** `apps/api/src/main.ts` — no security header middleware

### Files to change

- `apps/api/package.json`
- `apps/api/src/main.ts`

### Changes

```bash
cd apps/api && npm install helmet
```

```typescript
// main.ts
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers — must come before other middleware
  app.use(helmet());

  app.enableCors({
    origin: process.env.CORS_ALLOWED_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });

  // ... rest of bootstrap
}
```

The default `helmet()` configuration enables:
- `Content-Security-Policy` (restricts script/style sources)
- `Strict-Transport-Security` (enforces HTTPS after first visit)
- `X-Frame-Options: SAMEORIGIN` (clickjacking protection)
- `X-Content-Type-Options: nosniff` (MIME sniffing protection)
- `Referrer-Policy: no-referrer`
- `X-DNS-Prefetch-Control: off`
- `X-Download-Options: noopen`
- `X-Permitted-Cross-Domain-Policies: none`

**Note:** The default CSP may break the React frontend's inline scripts. Test locally and tune `contentSecurityPolicy` directives if needed:

```typescript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // may be needed for React
        connectSrc: ["'self'", process.env.CORS_ALLOWED_ORIGIN ?? 'http://localhost:5173'],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  }),
);
```

Also update `CORS_ALLOWED_ORIGIN` handling (see Task 2 note):

```typescript
app.enableCors({
  origin: process.env.CORS_ALLOWED_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
});
```

### Verification

- `curl -I http://localhost:3000/api/auth/login` → response includes `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`
- Frontend (`http://localhost:5173`) still loads and functions normally
- No new console errors in browser related to CSP violations

---

## Task 3 — Add `@MaxLength` to all freeform string DTO fields

**Severity:** Medium (authenticated DoS / storage exhaustion)  
**Source:** `create-wishlist-item.dto.ts`, `create-wishlist.dto.ts`, `create-family.dto.ts`, `update-wishlist-item.dto.ts`

### Files to change

- `apps/api/src/wishlist-items/dto/create-wishlist-item.dto.ts`
- `apps/api/src/wishlist-items/dto/update-wishlist-item.dto.ts`
- `apps/api/src/wishlists/dto/create-wishlist.dto.ts`
- `apps/api/src/wishlists/dto/update-wishlist.dto.ts` (if it exists)
- `apps/api/src/families/dto/create-family.dto.ts`

### Proposed limits

| Field | Max length | Rationale |
|---|---|---|
| `name` (item) | 200 | Product name rarely exceeds this |
| `note` | 2000 | Generous room for descriptions |
| `url` | 2048 | Standard URL max length |
| `category` | 100 | Short label |
| `store` | 100 | Short label |
| `variant` | 200 | Colour/size/model string |
| `title` (wishlist) | 100 | Human-readable label |
| `name` (family) | 100 | Human-readable label |

### Example changes

```typescript
// create-wishlist-item.dto.ts
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

@Transform(...)
@IsString()
@IsNotEmpty()
@MaxLength(200)
name: string;

@IsOptional()
@IsString()
@MaxLength(2000)
note?: string;

@IsOptional()
@IsString()
@MaxLength(100)
category?: string;

@IsOptional()
@IsString()
@MaxLength(100)
store?: string;

@IsOptional()
@IsString()
@MaxLength(200)
variant?: string;

// create-wishlist.dto.ts
@IsString()
@IsNotEmpty()
@MaxLength(100)
title: string;

// create-family.dto.ts
@IsString()
@IsNotEmpty()
@MaxLength(100)
name: string;
```

### Verification

- POST `/api/wishlists` with a `title` of 101 chars → 400 Bad Request
- POST `/api/wishlist-items` with a `name` of 201 chars → 400 Bad Request
- POST `/api/wishlist-items` with a `note` of 2000 chars → 201 Created
- All existing tests pass

---

## Task 4 — Scope user search to family members; remove email from response

**Severity:** High (PII exposure — email enumeration of entire user base)  
**Source:** `apps/api/src/users/users.service.ts:12-20`

### Files to change

- `apps/api/src/users/users.service.ts`
- `apps/api/src/users/users.service.spec.ts` (update tests)
- `apps/web/src/` — any component that reads `email` from search results

### Changes

Restrict results to users who share a family with `currentUserId`, and remove `email` from the returned shape:

```typescript
// users.service.ts
async searchUsers(currentUserId: number, query: string) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  return this.prisma.user.findMany({
    where: {
      id: { not: currentUserId },
      // Only return users who share a family with the current user
      memberships: {
        some: {
          family: {
            memberships: { some: { userId: currentUserId } },
          },
        },
      },
      OR: [
        { name: { contains: trimmed } },
        // Remove email from search to prevent enumeration;
        // users in the same family are findable by name only
      ],
    },
    select: { id: true, name: true }, // email intentionally excluded
    take: 10,
  });
}
```

**Note:** Removing email from the response may affect any frontend component that displays it. Audit `apps/web/src/` for `user.email` or `result.email` usages in the context of search results before merging.

### Verification

- User A (no family) searches for User B → empty results
- User A and User B share a family → User A can find User B by name
- Response shape is `{ id: number, name: string }` — no `email`
- Existing `users.service.spec.ts` tests updated to reflect new behaviour
- `npm test` passes

---

## Acceptance Criteria

- [ ] `npm audit --audit-level=high` exits 0
- [ ] All API responses include `X-Frame-Options`, `X-Content-Type-Options`, `Content-Security-Policy`
- [ ] POST with oversized field values returns 400, not 201/500
- [ ] User search returns only family-scoped results with no email field
- [ ] All 97+ tests pass
