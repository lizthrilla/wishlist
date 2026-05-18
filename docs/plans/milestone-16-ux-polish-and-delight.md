# Milestone 16: UX Polish & Delight

## Summary

Milestone 16 focuses on polishing the user experience across the wishlist app. Work is split into four phases ordered by dependency: UI foundation first (toast system, loading skeletons, mobile layout), then item feature additions, then backend-driven real-time and notification features, and finally frontend test coverage.

The frontend is React 19 + Tailwind CSS (Vite). The backend is NestJS with Prisma.

## Issues

| # | Title | Phase |
|---|-------|-------|
| #86 | Add toast/notification system | 1 |
| #87 | Add loading skeletons | 1 |
| #85 | Improve mobile responsiveness | 1 |
| #88 | Add item images | 2 |
| #91 | Add item categories/tags | 2 |
| #89 | Add item priority & drag-and-drop ordering | 2 |
| #90 | Add notifications (claim events) | 3 |
| #84 | Add real-time updates (claims/items) | 3 |
| #83 | Add frontend tests (React Testing Library) | 4 |

## Phases

- [Phase 1 — UI Foundation](./milestone-16-phase-1-ui-foundation.md)
- [Phase 2 — Item Feature Additions](./milestone-16-phase-2-item-features.md)
- [Phase 3 — Backend-Driven Features](./milestone-16-phase-3-backend-features.md)
- [Phase 4 — Testing](./milestone-16-phase-4-testing.md)

## Dependency Order

```
#86 (toast) ──► all other frontend tasks
#87 (skeletons) ──► #84 (real-time loading states)
#85 (mobile) ──► standalone
#88 (images) ──► verify backend DTOs; stretch scrape endpoint
#91 (categories) ──► verify backend DTOs; add filter UI
#89 (priority/ordering) ──► verify backend; upgrade to drag-and-drop
#90 (notifications) ──► depends on claim flow
#84 (real-time) ──► depends on #90 (claim events to broadcast)
#83 (tests) ──► after features stabilize
```
