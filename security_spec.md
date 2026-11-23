# SYNORA Security Specification

## Data Invariants
1. A student profile (`users/{uid}`) can only be read, created, or updated by the authenticated user matching `{uid}` (or an authorized Admin for support), and `role` must always be `'user'` on client creation and remain immutable.
2. Student subcollections (`examResults`, `savedScholarships`, `applications`) require the parent `users/{uid}` ownership and enforce `incoming().uid == uid` and `isValidId()` on path parameters.
3. Public scholarship (`scholarships`) and exam (`exams`) catalogs are read-only for normal users and writable strictly by authorized Admins verified via `admins/{uid}` existence or verified bootstrapped admin email (`email_verified == true`).
4. Client-supplied timestamps (`createdAt`, `updatedAt`) must strictly match `request.time`.
5. No user can write to `/admins/{uid}` from the client SDK.

## Dirty Dozen Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated read of `/users/user_123`.
2. Authenticated User A reading `/users/user_B`.
3. User creating `/users/user_A` with `role: "admin"` (privilege escalation).
4. User updating `/users/user_A` to change `role` from `"user"` to `"admin"`.
5. User creating `/users/user_A` with a shadow field `isAdmin: true`.
6. User creating `/users/user_A` with forged `createdAt` timestamp != `request.time`.
7. User A writing to `/users/user_B/applications/app_1`.
8. Normal user creating or updating `/scholarships/csc-2026`.
9. Normal user deleting `/exams/ielts`.
10. Attacker writing to `/admins/attacker_uid`.
11. User sending an oversized string (> 2000 chars) in `applications/{id}.notes` or > 128 chars in document ID.
12. Unverified-email token attempting admin write even with spoofed admin email (`email_verified: false`).
