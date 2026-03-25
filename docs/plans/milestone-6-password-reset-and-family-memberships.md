# Milestone 6: Password Reset and Family Memberships

## Summary

Finish the last two open issues in milestone 6 by adding a token-based password reset flow and family memberships that gate wishlist visibility. This work extends the existing Nest API and React web app without changing the session-based authentication foundation already merged.

Password reset is implemented without email delivery in this milestone. Family memberships are multi-family, users join by invite code, and wishlist reads are restricted to people who share at least one family.

## Implementation Plan

### API and Data Model

- Add a `PasswordResetToken` table tied to `User`.
- Store only a hashed reset token, expiry timestamp, created timestamp, and optional `usedAt`.
- Add `Family` and `FamilyMembership` tables.
- Keep users multi-family capable through a join table rather than a single `familyId`.
- Add uniqueness so the same user cannot join the same family twice.

### Auth and Authorization

- Add `POST /api/auth/forgot-password`.
- Add `POST /api/auth/reset-password`.
- Forgot-password always returns a generic success message, even for unknown emails.
- In non-production environments, the reset token is returned in the response so the flow is testable without email.
- Reset-password validates token expiry and one-time use, updates the password hash, invalidates active sessions, and marks the token used.
- Add family endpoints:
  - `GET /api/families`
  - `POST /api/families`
  - `POST /api/families/join`
- Change wishlist read authorization from “any authenticated user” to “authenticated user sharing at least one family with the wishlist owner.”
- Keep wishlist mutation rules owner-only.

### Web App

- Add forgot-password and reset-password forms to the auth flow.
- Surface development reset tokens in the UI when returned by the API.
- Add a family management panel that supports:
  - creating a family
  - joining a family by invite code
  - listing current memberships and join codes
- Update the shared wishlist feed copy so it explains that visibility is family-based.

## Public API and Data Model Changes

### Auth Endpoints

- `POST /api/auth/forgot-password`
  - Request: `{ email: string }`
  - Response: generic success payload
  - Development-only response may include `resetToken` and `expiresAt`
- `POST /api/auth/reset-password`
  - Request: `{ token: string, password: string }`
  - Response: success message

### Family Endpoints

- `GET /api/families`
  - Response: all families for the current user
- `POST /api/families`
  - Request: `{ name: string }`
  - Response: created family including generated join code
- `POST /api/families/join`
  - Request: `{ joinCode: string }`
  - Response: joined family summary

### Prisma Models

- `PasswordResetToken`
- `Family`
- `FamilyMembership`

## Test Plan

- Forgot-password returns success for both known and unknown emails.
- Reset-password accepts a valid token, updates the password, and invalidates prior sessions.
- Expired or invalid reset tokens are rejected.
- Creating a family adds the creator as a member.
- Joining by invite code adds a membership and rejects duplicates safely.
- Users can belong to multiple families.
- Wishlist reads fail with `403` when users do not share a family.
- Wishlist reads succeed when users share at least one family.
- Owner-only wishlist mutation behavior remains unchanged.

## Assumptions

- Real email delivery is out of scope for this milestone.
- Users can belong to more than one family.
- Joining a family is self-service through a join code, not an approval flow.
- Shared-family access applies to wishlist reads only; edits remain owner-only.

## How It Works

- A signed-out user can request a password reset token by email.
- If the account exists, the API creates a short-lived reset token and stores only its hash.
- In development, the raw reset token is returned so the reset flow can be completed without email infrastructure.
- Resetting the password consumes the token, updates the stored password hash, and invalidates existing sessions.
- A signed-in user can create a family, which generates a reusable join code and automatically adds the creator as a member.
- A signed-in user can join additional families by entering a valid invite code.
- The shared wishlist feed shows a user’s own items plus items owned by users who share at least one family membership.
- Users still cannot create or delete wishlist items on behalf of other users.
