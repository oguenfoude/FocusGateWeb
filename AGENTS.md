# FocusGate Web — Agent Instructions

## Overview

Next.js 16 + React 19 cloud admin dashboard for FocusGate modem gateway. Reads from MongoDB Atlas (synced from .NET gateway via SQLite).

## Stack

- **Framework:** Next.js 16 (webpack mode required)
- **React:** 19
- **Database:** MongoDB Atlas via Mongoose 9
- **Styling:** Tailwind CSS 4
- **Data Fetching:** SWR (30s auto-refresh)
- **Forms:** react-hook-form + Zod validation
- **i18n:** Custom JSON translations (en/fr/ar) via `useLanguage()` hook
- **Toast:** Sonner
- **Icons:** Lucide React

## Build & Run

```powershell
cd focusgate-web
npm run dev -- --webpack    # Dev server (port 3000)
npm run build -- --webpack  # Production build
npm run lint                # ESLint
npm start                   # Production server
```

**CRITICAL:** `--webpack` flag is required for dev and build. Next.js 16 defaults to Turbopack which doesn't work with this project.

## Project Structure

```
src/
├── app/                          — Pages and API routes (37 files)
│   ├── page.tsx                  — Root page (redirects to /login or /admin)
│   ├── layout.tsx                — Root layout (providers)
│   ├── not-found.tsx             — 404 page (client component for i18n)
│   ├── login/page.tsx            — Login page
│   ├── admin/                    — Admin panel (6 pages)
│   │   ├── layout.tsx            — Admin layout (sidebar + topbar)
│   │   ├── page.tsx              — Dashboard home (stat cards, modems, users)
│   │   ├── modems/page.tsx       — Modem list
│   │   ├── modems/[id]/page.tsx  — Modem detail
│   │   ├── users/page.tsx        — User list
│   │   ├── users/[id]/page.tsx   — User detail
│   │   ├── sms/page.tsx          — SMS logs
│   │   ├── withdrawals/page.tsx  — Withdrawal management
│   │   ├── warnings/page.tsx     — High balance alerts
│   │   └── settings/page.tsx     — Admin settings
│   ├── dashboard/                — User dashboard (5 pages)
│   │   ├── layout.tsx            — Dashboard layout
│   │   ├── page.tsx              — Dashboard home
│   │   ├── sims/page.tsx         — My SIM cards
│   │   ├── sms/page.tsx          — My SMS
│   │   ├── history/page.tsx      — Credit history
│   │   └── withdraw/page.tsx     — Withdraw funds
│   └── api/                      — API routes (15 files)
│       ├── auth/login/route.ts   — Login
│       ├── events/route.ts       — SSE live notifications
│       ├── admin/                — Admin APIs (modems, users, sms, withdrawals, seed)
│       └── dashboard/            — Dashboard APIs (overview, sims, sms, history, withdraw)
│
├── components/                   — React components (31 files)
│   ├── admin/                    — Admin panel components (9)
│   ├── dashboard/                — User dashboard components (5)
│   ├── shared/                   — Shared components (6)
│   ├── ui/                       — UI primitives (8)
│   └── *.tsx                     — Root providers (3)
│
├── lib/                          — Utilities and models (19 files)
│   ├── mongodb.ts                — MongoDB connection singleton
│   ├── models/                   — Mongoose models (9)
│   ├── number-utils.ts           — toNum() / toNumOrNull()
│   ├── date-utils.ts             — formatDate() / formatShortDate() locale-aware
│   ├── id-generator.ts           — nextId() safe ID generation
│   ├── balance-utils.ts          — Balance helpers + translation keys
│   ├── sms-classifier.ts         — SMS type classification
│   ├── modem-utils.ts            — Modem helper functions
│   └── i18n.ts                   — Translation loading
│
└── i18n/                         — Translations (3 files)
    ├── en.json                   — English (14 top-level keys)
    ├── fr.json                   — French
    └── ar.json                   — Arabic
```

## Critical Conventions

### MongoDB

- **Collection names are ALL lowercase:** `modems`, `simcards`, `smsrecords`, `users`, `usermodems`, `balancehistories`, `withdrawalrequests`, `userbalancehistories`
- **`_id` is Number (long):** NOT ObjectId. Mongoose models use `BsonClassMap` mapping. Old records have oversized IDs from `Date.now() * 10000`.
- **Use raw collection for oversized IDs:** `mongoose.connection.db.collection(...)` with `as Record<string, unknown>` cast
- **Decimal128 fields:** Use `toNum()` from `@/lib/number-utils`. `Number()` on Decimal128 gives `[object Object]`
- **Online status:** `status === 4` only. Do NOT add `updatedAt` staleness checks.

### i18n

- **Hook:** `useLanguage()` returns `{ t, locale }`
- **Dates:** Use `formatDate()` / `formatShortDate()` from `@/lib/date-utils`
- **Numbers:** All `toLocaleString()` must use locale from `useLanguage()`:
  ```typescript
  const loc = locale === 'fr' ? 'fr-FR' : locale === 'ar' ? 'ar-DZ' : 'en-US'
  value.toLocaleString(loc)
  ```
- **Translation keys:** 14 top-level sections (app, nav, auth, dashboard, modems, modemDetail, users, sms, withdrawals, warnings, settings, mySims, history, withdraw, simCard, dashboardSms, common, balanceSource)
- **Not-found page:** Client component (needs `useLanguage()` hook)

### Auth

- **No server-side sessions** — localStorage-based
- **Login:** `POST /api/auth/login` → stores `userId` + `role` in localStorage
- **Layout guards:** Redirect to `/login` if no `userId` in localStorage
- **Sidebar:** pathname-based `isAdmin` via `useSyncExternalStore` + localStorage
- **Logout:** Clears localStorage, redirects to `/login`

### Data Fetching

- **SWR** with 30s auto-refresh for all data
- **SSE** via `/api/events` for live toast notifications
- **Cache:** `focusgate:swr` cache key

### Withdrawal Flow

```
User submits → WithdrawalRequest created (status=0, balance unchanged)
    ↓
Admin approves → balance = oldBalance - amount → BalanceHistory(source=4) + UserBalanceHistory(type=1)
Admin rejects  → status=2, no balance change
```

### Balance Rules

- **User SIM cards:** Balance hidden from user view (wallet only)
- **Admin dashboard:** Total SIM balance = online modems only
- **Balance staleness:** Online=green, Offline=gray+"(last known)"
- **Balance source:** `*222#` USSD is single source of truth. Mobilis SMS is trigger only.

### Locale-Aware Formatting

- **Dates:** `formatDate(date, locale)` from `@/lib/date-utils`
- **Numbers:** `value.toLocaleString(loc)` where `loc` comes from `useLanguage()`
- **Currency:** All "DA" labels translated via `t('common.da')`
- **Labels:** All enum labels use translation keys (e.g., `getUserBalanceTypeLabelKey()`)

## Mongoose Models

| Model | Collection | Key Fields |
|-------|-----------|------------|
| `Modem` | `modems` | id, Status, IMEI, Brand, Model, SimCardId, MachineId |
| `SimCard` | `simcards` | id, ModemId, IMSI, PhoneNumber, Balance, IsActive |
| `SmsRecord` | `smsrecords` | id, SimCardId, Sender, Content, ReceivedAt |
| `User` | `users` | id, Username, DisplayName, Password, Role, WalletBalance |
| `UserModem` | `usermodems` | id, UserId, ModemId |
| `WithdrawalRequest` | `withdrawalrequests` | id, UserId, Amount, Status, AdminNote, ProcessedByAdminId |
| `UserBalanceHistory` | `userbalancehistories` | id, UserId, Amount, Type, Note |
| `BalanceHistory` | `balancehistories` | id, SimCardId, Amount, PreviousBalance, NewBalance, Source |
| `Command` | `commands` | id, Target, Type, Payload, Status |

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/login` | POST | Login (returns userId, role) |
| `/api/events` | GET | SSE live notifications |
| `/api/admin/seed` | POST | Seed admin user |
| `/api/admin/modems` | GET | List modems |
| `/api/admin/modems/[id]` | GET/PATCH | Modem detail/update |
| `/api/admin/users` | GET/POST | List/create users |
| `/api/admin/users/[id]` | GET/PATCH/DELETE | User detail/update/delete |
| `/api/admin/sms` | GET | List SMS with filters |
| `/api/admin/withdrawals` | GET/POST | List/create withdrawals |
| `/api/admin/withdrawals/[id]` | PATCH | Approve/reject withdrawal |
| `/api/dashboard/overview` | GET | Dashboard stats |
| `/api/dashboard/sims` | GET | User's SIM cards |
| `/api/dashboard/sms` | GET | User's SMS |
| `/api/dashboard/history` | GET | User's balance history |
| `/api/dashboard/withdraw` | POST | Create withdrawal request |

## Gotchas

- **No ComPort in web** — removed from all pages
- **Oversized IDs** — Old MongoDB records have IDs > MAX_SAFE_INTEGER. Use raw collection queries.
- **NextAuth removed** — No `NEXTAUTH_SECRET` or `NEXTAUTH_URL` in `.env.local`
- **date-fns removed** — Use custom `lib/date-utils.ts`
- **LiveProvider key path** — modem detail uses `modemDetail.*` (NOT `usersDetail.*`)
- **User detail page** — Client component for i18n header
- **Not-found page** — Client component for i18n
