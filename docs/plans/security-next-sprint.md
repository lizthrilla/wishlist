# Security Remediation — Next Sprint

## Summary

Defense-in-depth improvements and hardening tasks. None of these are immediately exploitable under normal conditions, but all improve the overall security posture for production deployment.

## Prerequisites

- `security-this-week.md` tasks are merged
- `security-this-sprint.md` tasks are merged

---

## Task 1 — Move CORS origin to env var and create `.env.example`

**Severity:** Medium  
**Source:** `apps/api/src/main.ts:9` — `origin: 'http://localhost:5173'` is hardcoded

### Problem

There is no documented env var for the production frontend URL. When deploying, either the CORS config silently blocks all requests from the real domain, or a developer widens it to `'*'` as a quick fix.

### Files to change

- `apps/api/src/main.ts` (already partially addressed if Helmet task included the CORS fix)
- `apps/api/.env.example` (create)
- `apps/api/.env` (local — add entry, do not commit)
- `README.md` — document the env vars

### Changes

Ensure `main.ts` uses the env var (should already be done in sprint task):

```typescript
app.enableCors({
  origin: process.env.CORS_ALLOWED_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
});
```

Create `apps/api/.env.example`:

```dotenv
# Database
DATABASE_URL="file:./dev.db"

# CORS — set to your frontend's origin in production
# Example: CORS_ALLOWED_ORIGIN=https://wishlist.example.com
CORS_ALLOWED_ORIGIN=http://localhost:5173

# Development only — returns password reset tokens in API responses.
# DO NOT set on staging or production servers.
DEV_RETURN_RESET_TOKEN=true

# Runtime
NODE_ENV=development
PORT=3000
```

Update `README.md` to reference `.env.example` in the setup section.

### Verification

- Fresh clone: copy `.env.example` → `.env`, run `npm run dev` → app starts correctly
- CORS request from `http://localhost:5173` is accepted
- CORS request from `http://evil.example.com` is rejected (403)

---

## Task 2 — Upgrade session cookie `sameSite` to `'strict'`

**Severity:** Low  
**Source:** `apps/api/src/auth/auth.controller.ts` — session cookie set with `sameSite: 'lax'`

### Problem

`sameSite: 'lax'` allows the cookie to be sent on top-level cross-site navigations. `sameSite: 'strict'` is the correct value for an application where users authenticate directly — they don't arrive via shared links that need to carry auth context.

### Files to change

- `apps/api/src/auth/auth.controller.ts` — everywhere `response.cookie(AUTH_COOKIE_NAME, ...)` is called

### Changes

```typescript
response.cookie(AUTH_COOKIE_NAME, result.token, {
  httpOnly: true,
  sameSite: 'strict',     // ← was 'lax'
  secure: process.env.NODE_ENV === 'production',
  maxAge: SESSION_DURATION_MS,
  path: '/',
});
```

Apply this change consistently to both the `login` and `register` handlers (and any other place the session cookie is written).

### Verification

- After login, `Set-Cookie` response header includes `SameSite=Strict`
- Session still works for normal browser navigation within the app
- Cross-origin form POST (simulated via different port) does NOT send the cookie

---

## Task 3 — Increase scrypt parameters and store them in the hash string

**Severity:** Low  
**Source:** `apps/api/src/auth/auth.utils.ts:13,24`

### Problem

`scrypt(password, salt, 64)` is called with no options, using Node.js defaults: `N=16384, r=8, p=1`. OWASP (2023) recommends `N=65536` as the minimum for `scrypt`. The parameters are also not stored in the hash, making future upgrades difficult.

### Files to change

- `apps/api/src/auth/auth.utils.ts`
- `apps/api/src/auth/auth.utils.spec.ts` (update test vectors)

### Changes

Store parameters in the hash string in a format that supports future upgrades:

```typescript
// auth.utils.ts
const SCRYPT_N = 65536;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_LEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(password, salt, SCRYPT_KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  })) as Buffer;
  // Format: scrypt:N:r:p:salt:hash
  return `scrypt:${SCRYPT_N}:${SCRYPT_R}:${SCRYPT_P}:${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  // Support both legacy format (salt:hash) and new format (scrypt:N:r:p:salt:hash)
  const parts = stored.split(':');

  let salt: string;
  let storedHash: string;
  let N = 16384, r = 8, p = 1; // legacy defaults

  if (parts[0] === 'scrypt' && parts.length === 6) {
    [, N, r, p, salt, storedHash] = parts as unknown as [string, number, number, number, string, string];
    N = Number(N); r = Number(r); p = Number(p);
  } else {
    // Legacy format: salt:hash
    [salt, storedHash] = parts;
  }

  const derivedKey = (await scrypt(password, salt, SCRYPT_KEY_LEN, { N, r, p })) as Buffer;
  const storedBuffer = Buffer.from(storedHash, 'hex');
  return timingSafeEqual(derivedKey, storedBuffer);
}
```

**Migration note:** Existing password hashes use the legacy format. `verifyPassword` handles both formats. Hashes will be transparently upgraded to the new format on next login (rehash-on-verify pattern):

```typescript
// auth.service.ts — in login(), after successful verification:
if (!storedHash.startsWith('scrypt:')) {
  const newHash = await hashPassword(dto.password);
  await this.prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });
}
```

### Verification

- New registrations produce hashes starting with `scrypt:65536:8:1:`
- Login with a legacy hash still succeeds (backward compat)
- Login with a legacy hash upgrades the stored hash to the new format
- `auth.utils.spec.ts` updated with new test vectors

---

## Task 4 — Allow multiple concurrent sessions (or add explicit "sign out all devices")

**Severity:** Low  
**Source:** `apps/api/src/auth/auth.service.ts:113-116`

### Problem

`login()` calls `session.deleteMany({ where: { userId: user.id } })` unconditionally, invalidating all existing sessions on every login. An authenticated attacker with valid credentials can persistently force-logout a legitimate user by repeatedly logging in. This also makes the app unusable across multiple devices.

### Option A — Multiple concurrent sessions (recommended)

```typescript
// auth.service.ts — login()
// Replace deleteMany with cleanup of expired sessions only
await this.prisma.session.deleteMany({
  where: {
    userId: user.id,
    expiresAt: { lte: new Date() },  // only expired sessions
  },
});
```

### Option B — Single session with "sign out other devices" UX

Keep `deleteMany` but add a dedicated `POST /api/auth/sign-out-all` endpoint with a clear UI affordance. This makes the single-session behaviour explicit rather than silent.

### Recommendation

Option A (multiple sessions) is the better default for a personal/family app used across phone, tablet, and desktop.

### Verification

- Log in on Device A → session cookie A is valid
- Log in on Device B → session cookie A is still valid
- Log out on Device B → only Device B's session is invalidated
- Old expired sessions are cleaned up on each new login

---

## Task 5 — Bump password minimum length to 12 characters

**Severity:** Info  
**Source:** `apps/api/src/auth/dto/register.dto.ts:12`

### Problem

`@MinLength(6)` is below OWASP SP 800-63B recommendation (8 chars minimum) and NIST guidance (12+ chars). This was partially addressed in "this week" by adding `@MaxLength(72)` and bumping to `@MinLength(8)`. This task completes the upgrade to 12.

### Changes

```typescript
// register.dto.ts
@IsString()
@MinLength(12)
@MaxLength(72)
password: string;
```

**Note:** Applies to new registrations only. Existing users are not required to change passwords (that would require a password-change enforcement flow). Document the policy change in release notes.

The `LoginDto` and `ResetPasswordDto` should NOT have `@MinLength(12)` — those accept existing passwords of any length; only registration enforces the minimum.

### Verification

- POST `/api/auth/register` with an 11-char password → 400
- POST `/api/auth/register` with a 12-char password → 201
- POST `/api/auth/login` with an 8-char password for an existing account → 200 (not blocked)

---

## Acceptance Criteria

- [ ] `.env.example` committed and referenced in README
- [ ] Session cookie `Set-Cookie` includes `SameSite=Strict`
- [ ] New password hashes start with `scrypt:65536:8:1:`
- [ ] Existing (legacy) password hashes still verify correctly
- [ ] Log in on two devices simultaneously — both sessions remain valid
- [ ] POST `/api/auth/register` with 11-char password returns 400
- [ ] All tests pass
