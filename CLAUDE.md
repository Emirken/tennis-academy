# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Urla Tenis Akademisi — a Vue 3 + Firebase web app for managing a tennis academy (students, courts, reservations, lessons, billing). The codebase, comments, and commit messages are predominantly in Turkish; follow that convention when adding comments.

## Commands

```bash
npm run serve          # Vue CLI dev server (hot reload)
npm run build          # Production build (drops all console.* / debugger — see vue.config.js)

# Tests (Vitest, jsdom env, '@' aliased to src/)
npm run test:unit              # ⚠️ runs ONLY tests/unit/reservations.spec.ts
npx vitest run tests/unit                          # all unit specs
npx vitest run tests/unit/courtScheduleBuild.spec.ts   # a single spec
npx vitest watch tests/unit/courtScheduleBuild.spec.ts # watch one spec
npm run test:integration       # tests/integration (needs Firestore emulator)
npm run test:rules             # firestore.rules tests (spins up emulators via firebase emulators:exec)
npm run test:e2e               # Playwright (tests/e2e)

# Cloud Functions (functions/, separate package, Node 20)
cd functions && npm run build      # tsc → lib/
cd functions && npm run deploy     # firebase deploy --only functions
cd functions && npm run logs
```

Note: `npm run test:unit` does NOT run the full unit suite — it only runs one file. Use `npx vitest run tests/unit` to run everything. The repo has no linter wired into the frontend `package.json` (only `functions/` has `eslint`).

## Architecture

**Stack:** Vue 3 (Composition + Options), Vuetify 3, Pinia (state), Vue Router, Firebase (Auth + Firestore + Functions + Messaging). Built with Vue CLI (webpack); Vitest/Playwright use Vite directly.

**Three roles** (`UserRole` in `src/types/user.ts`): `student`, `admin`, `boss`. Boss is a superset of admin — `isAdmin` getter returns true for boss, boss can access all `/admin/*` routes (router guard) and write all collections (firestore.rules). Only login redirect and the `/boss/*` panel distinguish them. Routes are role-gated in `src/router/index.ts` via `meta.role` + a `beforeEach` guard.

**Auth model (no real emails):** Users log in with an 11-digit phone number. The phone is converted to a dummy email `{phone}@tennis.local` for Firebase Auth — this `phoneToEmail` mapping is duplicated in `src/services/auth.ts`, `src/store/modules/auth.ts`, and `functions/src/index.ts` and **must stay identical** across all three. Account state lives in `users/{uid}` Firestore docs (`role`, `status`, `deleted`, `mustResetPassword`).

**Auth store is the source of truth** (`src/store/modules/auth.ts`). `fetchUserData` attaches a *live* `onSnapshot` listener to `users/{uid}` (not a one-time read), so role/membership/status changes propagate instantly and a soft-deleted account is logged out mid-session. **Critical invariant:** when the user doc is missing, `fetchUserData` must NOT auto-create one — doing so once overwrote the boss account and demoted it to student (see memory `auth-no-auto-create-on-missing-doc`). It signs out with an error instead.

**Soft delete:** students are never hard-deleted client-side (Spark plan can't delete others' Auth records from the client). Deletion sets `deleted: true` / `status: 'deleted'` and anonymizes fields; the `deleteUserAccount` Cloud Function removes the Auth record separately.

### Reservations & court scheduling (the core domain)

Reservations and lessons both live in the **`reservations`** collection but are different concepts:
- **Reservations** = court rentals a student books themselves (`type: 'court-rental'`).
- **Lessons** = group/private lessons admin generates from a weekly schedule (`group-lesson` / `private-lesson`, marked by `groupId` / `groupAssignment` / `groupSchedule`).

`isLessonDoc()` is the single discriminator. Lessons do NOT count toward the "one reservation per student per day" limit and do NOT appear in a student's "Rezervasyonlarım" list.

**Single-source-of-truth utilities — do not duplicate this logic, import these:**
- `src/utils/dailyReservationLimit.ts` — `isSlotBlockingReservation` (which statuses mark a slot OCCUPIED: pending/confirmed/active/no-status = full; cancelled/completed/no_show = free), `isLessonDoc`, `getReservationGroupId`, `isOrphanGroupReservation`, `isPastReservationDoc`, `normalizeReservationDate`, `hasActiveReservationOnDate`. **Never do server-side `status` filtering for occupancy** — fetch and apply this set client-side, or calendars and the booking form will disagree.
- `src/utils/courtScheduleBuild.ts` — `buildCourtSchedule`, the occupancy engine that builds the day's court grid. **Live `reservations` is the source of truth, not the `courtSchedule` snapshot doc** (the snapshot goes stale). Snapshot is read only for admin `maintenance`/`closed` states and a group-lesson fallback. Two flags control behavior: `adminParity` (ignore snapshot entirely, treat everything except `cancelled` as full — used by the student calendar to match the admin calendar exactly) and `ignoreSnapshotGroupFallback` (used by `/courts`).
- `src/utils/reservationCancel.ts` — `getReservationIdsToCancel` (cancelling a group reservation cancels ALL members'). Watch the `courtId` trap: display ids (`K1`) vs raw Firestore ids (`court-1`); slots carry `rawCourtId` for member matching.
- `src/utils/reservationTypeColor.ts` — calendar colors are keyed by reservation TYPE, not court (group=orange, private=green, rental=purple). Shared by admin + student calendars.
- `src/utils/studentCounts.ts` — `isActiveStudent` (`status === 'active' || 'approved'`, excluding `deleted`) is the ONE definition of "active student"; admin card, boss count, and revenue all use it. Pending students never count.
- `src/utils/bossMetrics.ts` — `computeMonthlyRevenue` excludes `basic` (Temel Üyelik) members; current-month court reservations added as a separate line.
- `src/services/groupScheduleSync.ts` — on group create/update, generates per-member reservations for the next 3 months from the weekly schedule (no cron). Keeps `groups`, user profiles, `reservations`, and the `courtSchedule` snapshot in sync. Also handles clearing stale snapshot slots when a group changes courts.
- `src/utils/studentGroupExit.ts` — `resolveGroupExitOnSave`: pure decision for making a group student inactive (→ basic membership, removed from group, future group reservations cancelled).

When you change any of these shared utilities, run the matching spec in `tests/unit/` (each has one, e.g. `courtScheduleBuild.spec.ts`, `dailyReservationLimit.spec.ts`, `reservationCancel.spec.ts`, `bossMetrics.spec.ts`, `studentCounts.spec.ts`).

### Cloud Functions (`functions/src/index.ts`)

Three `onCall` (callable) functions that need the Admin SDK (client SDK can't do these on the Spark plan): `setTempPassword` (admin assigns a temp password + sets `mustResetPassword`), `updateUserPhone` (changes both Auth email and Firestore `phone_number` atomically — both must move together since login uses the phone), `deleteUserAccount` (removes the Auth record; idempotent). Each re-verifies the caller's role from Firestore — don't trust the client.

### Layout

```
src/
  views/          route-level pages (Login, *Dashboard, Reservations, Courts, ...)
  components/      admin/ (AdminCalendar, StudentManagement, GroupManagement, ...),
                  student/ (StudentCourtCalendar), reservations/ (ReservationForm), common/
  store/modules/   Pinia stores: auth, students, courts, reservations, groups, payments, membershipTypes
  services/        Firebase wrappers: firebase (init), auth, firestore, notificationService,
                  pushNotificationService, groupScheduleSync, passwordResetService
  utils/          PURE single-source-of-truth domain logic (see above) — heavily unit-tested
  types/          domain interfaces (user, reservation, court, group, ...)
  composables/     useAuth, useReservations, useCourts, useStudents
scripts/          *.cjs Node maintenance scripts (create-admin, restore-boss-user, cleanup-*, diagnose-*)
                  authenticate via the Firebase CLI refresh_token in ~/.config/configstore
functions/        Cloud Functions (separate package.json, tsc build, Node 20)
firestore.rules   security rules (isAdmin/isBoss/isAdminOrBoss helpers)
```

### Firebase project

Project id `urla-tenis`. Frontend config falls back to hardcoded values in `src/services/firebase.ts` but is overridable via `VUE_APP_FIREBASE_*` env vars. Emulators connect only when `VUE_APP_USE_FIREBASE_EMULATORS=true` in development (Auth 9099, Firestore 8080, Storage 9199, Functions 5001).

## Conventions

- Comments/log messages are Turkish. Match the surrounding density and style.
- Keep occupancy/role/active-student decisions in the shared `utils/` modules — these exist specifically so admin, student, and boss views never diverge. The unit tests encode the invariants; if you change behavior, update the spec, don't delete the assertion.
- `scripts/` `.cjs` files run as one-off operational tools (recovering the boss user, cleaning orphan reservations/stale schedules) — they default to dry-run and need `--apply` to write.
