# PROTOCOL — Platform Architecture Document

> **Version:** 0.1.0 (MVP)
> **Last Updated:** March 2026
> **Status:** Development / Pre-Launch

---

## 1. Executive Summary

PROTOCOL is a brutalist, anti-pattern dating web application for adults 28+. It is not a traditional dating app — it is a **time-pressured logistics engine** designed to force real-life meetings within 120 hours (5 days). If two matched users fail to meet, the match is permanently deleted.

**Core philosophy:** No swiping, no hearts, no infinite scrolling. Heavy intentionality, accountability via reliability scoring, paid commitment via a Season Pass, and chat moderation that prevents users from bypassing the platform.

---

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js (App Router) | 14.2.x | Full-stack React framework with server-side rendering |
| **Language** | TypeScript | 5.6.x | Type safety across client and server |
| **Database** | SQLite (dev) / PostgreSQL (prod) | — | Relational data store via Prisma ORM |
| **ORM** | Prisma | 6.x | Schema-driven database access layer |
| **Styling** | Tailwind CSS | 3.4.x | Utility-first CSS (brutalist dark theme) |
| **Animation** | Framer Motion | 11.x | Blur transitions, UI state animations |
| **Icons** | Lucide React | 0.460.x | Sharp, industrial iconography |
| **Payments** | Stripe | 20.x (API 2026-02-25) | Checkout sessions, refunds, webhooks |
| **Real-time** | Pusher | 5.x server / 8.x client | WebSocket-based chat delivery |
| **File Storage** | Vercel Blob | 2.x | Video upload storage (with local fallback) |
| **QR Codes** | qrcode | 1.5.x | Joint Exit QR generation |
| **Deployment** | Vercel | — | Hosting, cron jobs, serverless functions |

---

## 3. Project Structure

```
protocol-web/
├── prisma/
│   ├── schema.prisma          # Data models (6 tables)
│   ├── seed.ts                # Mock data seeder (7 users, 3 matches)
│   └── dev.db                 # SQLite database (dev only)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # 18 API route files (25 handlers)
│   │   │   ├── cron/expire-matches/    # Scheduled match expiration
│   │   │   ├── debrief/[matchId]/      # Post-meeting feedback
│   │   │   ├── endorse/                # Endorse/pass actions
│   │   │   ├── feed/                   # Profile feed
│   │   │   ├── joint-exit/             # QR-paired account deletion
│   │   │   ├── matches/               # Match listing
│   │   │   │   └── [matchId]/
│   │   │   │       ├── accept-extension/   # Accept 72h extension
│   │   │   │       ├── request-extension/  # Request 72h extension
│   │   │   │       └── schedule-attempt/   # Mark scheduling attempt
│   │   │   ├── messages/              # Chat with screening
│   │   │   ├── onboarding/            # User registration
│   │   │   ├── operator-config/       # Settings CRUD
│   │   │   ├── profile/               # Profile & stats
│   │   │   ├── protocol/[matchId]/    # Meeting scheduling
│   │   │   ├── subscribe/             # Season Pass checkout
│   │   │   ├── upload/                # Video upload
│   │   │   └── webhooks/stripe/       # Stripe payment hooks
│   │   ├── activated/         # Post-onboarding confirmation
│   │   ├── chat/[matchId]/    # Real-time chat UI
│   │   ├── debrief/[matchId]/ # Post-meeting debrief form
│   │   ├── feed/              # Profile browsing (Vibe Check)
│   │   ├── joint-exit/        # QR code joint deletion
│   │   ├── matches/           # Active match list (Sprint)
│   │   ├── onboarding/        # 6-step registration wizard
│   │   ├── operator-config/   # Settings/preferences
│   │   ├── profile/           # User stats dashboard
│   │   ├── protocol/[matchId]/ # Meeting scheduler
│   │   ├── subscribe/         # Season Pass purchase
│   │   ├── globals.css        # Tailwind + custom utilities
│   │   ├── layout.tsx         # Root layout with NavBar
│   │   └── page.tsx           # Root redirect (server)
│   └── lib/
│       ├── auth.ts            # Cookie-based user identification
│       ├── chat-screening.ts  # Regex content moderation engine
│       ├── components.tsx     # NavBar + CountdownTimer
│       ├── prisma.ts          # Singleton Prisma client
│       ├── pusher.ts          # Pusher server/client helpers
│       └── stripe.ts          # Stripe singleton + fee constants
├── .env                       # Environment variables
├── vercel.json                # Cron job configuration
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Data Model (ERD)

### 4.1 Tables

```
┌─────────────────┐     ┌──────────────┐     ┌──────────────┐
│      User        │     │  Endorsement │     │     Pass     │
├─────────────────┤     ├──────────────┤     ├──────────────┤
│ id          (PK) │◄────│ fromUserId   │     │ fromUserId   │
│ name             │     │ toUserId     │     │ toUserId     │
│ age              │     │ createdAt    │     │ createdAt    │
│ gender           │     └──────────────┘     └──────────────┘
│ interestedIn     │
│ fiscalArchetype  │     ┌──────────────────────────────────┐
│ attachmentStyle  │     │             Match                │
│ socialBattery    │     ├──────────────────────────────────┤
│ lifePace         │     │ id                       (PK)    │
│ videoUrl         │     │ user1Id                  (FK)    │
│ locationCity     │     │ user2Id                  (FK)    │
│ locationLat/Lng  │     │ status (ACTIVE|EXPIRED|          │
│ dailySwipesLeft  │     │         PROTOCOL_SET)            │
│ lastSwipeDate    │     │ expiresAt                        │
│ reliabilityScore │     │ protocolDate/Time/Location       │
│ isGhostMode      │     │ user1TriedToSchedule             │
│ targetMin/MaxAge │     │ user2TriedToSchedule             │
│ targetArchetypes │     │ extensionRequestedBy             │
│ targetAttachment │     │ extensionUser1Paid               │
│ targetSocialBat. │     │ extensionUser2Paid               │
│ targetLifePace   │     │ extensionApplied                 │
│ religion         │     │ extensionStripeId1/2             │
│ politicalLeaning │     └──────┬──────────────┬────────────┘
│ kidsPreference   │            │              │
│ targetReligion   │     ┌──────▼──────┐ ┌─────▼──────┐
│ targetPolitical  │     │   Message   │ │  Debrief   │
│ targetKids       │     ├─────────────┤ ├────────────┤
│ dealbreakers     │     │ matchId (FK)│ │ matchId(FK)│
│ strongPreferences│     │ senderId(FK)│ │ userId (FK)│
│ tags             │     │ content     │ │ showed     │
│ chatStrikes      │     │ isSystem    │ │ rating     │
│ shadowBannedUntil│     │ isScreened  │ │ note       │
│ subscriptionStat.│     │ createdAt   │ │ createdAt  │
│ stripeCustomerId │     └─────────────┘ └────────────┘
│ stripeSessionId  │
│ subscriptionPaid │
│ subscriptionAmt  │
│ jointExitCode    │
│ jointExitPartner │
│ createdAt        │
└─────────────────┘
```

### 4.2 Relationships

| Relationship | Type | Description |
|---|---|---|
| User → Match | 1:N (x2) | A user can be `user1` or `user2` on many matches |
| User → Message | 1:N | A user sends many messages |
| User → Endorsement | 1:N | Tracks who endorsed whom (unique pair constraint) |
| User → Pass | 1:N | Tracks who passed on whom (unique pair constraint) |
| User → Debrief | 1:N | Post-meeting feedback per match |
| Match → Message | 1:N | A match contains many messages |
| Match → Debrief | 1:N | A match can have debriefs from both parties |

---

## 5. API Architecture

### 5.1 Authentication

Currently cookie-based mock auth. The `protocol-user-id` cookie stores the user's UUID. The `getCurrentUserId()` helper reads this from Next.js `cookies()`.

> **Production note:** Replace with a proper auth provider (e.g., NextAuth.js, Clerk, or Supabase Auth) with JWT/session tokens.

### 5.2 API Route Inventory

#### User Lifecycle

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/onboarding` | No | Create a new user (6-step intake) |
| POST | `/api/upload` | No | Upload 15-sec video (Vercel Blob or local) |
| GET | `/api/profile` | Yes | Fetch profile + match stats |
| DELETE | `/api/profile` | Yes | Delete account + all related data |
| GET | `/api/operator-config` | Yes | Fetch all user settings |
| PATCH | `/api/operator-config` | Yes | Update settings (with archetype cooldown) |
| DELETE | `/api/operator-config` | Yes | Delete account (cascade) |

#### Feed & Matching

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/feed` | Yes | Fetch up to 20 compatible profiles (multi-axis filter + soft scoring) |
| POST | `/api/endorse` | Yes | Endorse or pass on a profile. Decrements daily swipes. Creates mutual match if reciprocated. |
| GET | `/api/matches` | Yes | List active + protocol-set matches |
| PATCH | `/api/matches/[matchId]` | Yes | Update match status |

#### Chat & Messaging

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/messages?matchId=X` | Yes | Fetch all messages for a match |
| POST | `/api/messages` | Yes | Send message (with content screening + strike system) |

#### Meeting Scheduling

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/protocol/[matchId]` | Yes | Fetch protocol scheduling data |
| POST | `/api/protocol/[matchId]` | Yes | Set meeting date/time/location |
| POST | `/api/matches/[matchId]/schedule-attempt` | Yes | Flag that user tried to schedule (for asymmetric reliability) |
| POST | `/api/debrief/[matchId]` | Yes | Submit post-meeting debrief |

#### Payments (Stripe)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/subscribe` | Yes | Create Stripe Checkout for Season Pass ($90) |
| GET | `/api/subscribe` | Yes | Check subscription status |
| POST | `/api/matches/[matchId]/request-extension` | Yes | Pay $3 to request 72h extension (last 24h only) |
| POST | `/api/matches/[matchId]/accept-extension` | Yes | Pay $3 to accept extension (other party) |
| POST | `/api/webhooks/stripe` | No* | Stripe webhook (signature-verified) |
| POST | `/api/joint-exit` | Yes | Generate joint exit code |
| PATCH | `/api/joint-exit` | Yes | Confirm joint exit with partner's code (triggers 30% refund) |

#### Background Jobs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cron/expire-matches` | Bearer | Runs every minute. Expires matches past deadline, applies asymmetric reliability penalties, auto-refunds unaccepted extensions. |

---

## 6. Core Feature Architecture

### 6.1 Matching Algorithm (Multi-Axis Compatibility)

The feed algorithm at `/api/feed` applies filters in this order:

```
1. HARD FILTERS (exclusion)
   ├── Gender / Interested-In mutual compatibility
   ├── Age range (mutual — each user's age within the other's target range)
   ├── Fiscal Archetype (mutual target lists)
   ├── Attachment Style (mutual, if specified)
   ├── Social Battery (mutual, if specified)
   ├── Life Pace (mutual, if specified)
   ├── Religion (mutual target lists)
   ├── Political Leaning (mutual target lists)
   ├── Kids Preference (mutual target lists)
   └── Dealbreakers (hard exclusion on matching tags)

2. SOFT SCORING (deprioritization, not exclusion)
   ├── Strong Preferences vs. candidate tags (−15 score per match)
   └── Candidate's Strong Preferences vs. user tags (−15 score per match)

3. SORT by adjusted reliability score (descending)
4. LIMIT to 20 profiles
```

**Rate Limiting:** 20 endorsements/passes per day per user, enforced server-side.

**Focus Mode:** If a user has 3+ active matches, the feed locks entirely with a message to focus on existing conversations.

### 6.2 Match Lifecycle

```
                    120h countdown starts
ENDORSEMENT ───► MUTUAL ───► ACTIVE ──┬──► PROTOCOL_SET ──► DEBRIEF
                                       │        (meeting scheduled)
                                       │
                                       ├──► EXTENSION (+72h if both pay)
                                       │        │
                                       │        └──► ACTIVE (extended)
                                       │
                                       └──► EXPIRED
                                            (reliability penalties applied)
```

**States:** `ACTIVE` → `PROTOCOL_SET` → (debrief) or `EXPIRED`

**Countdown display:** Real-time client-side timer. Orange at <24h, red at <12h.

### 6.3 Chat Content Screening

Every outgoing message passes through `src/lib/chat-screening.ts` before storage:

```
Message Input
    │
    ▼
┌──────────────────────┐
│  Regex Screening     │
│  ├── Phone numbers   │  (555-1234, +1-555-1234, (555) 123-4567)
│  ├── Social handles  │  (@user, ig: handle, snap: user, etc.)
│  ├── URLs / domains  │  (https://..., anything.com)
│  └── Emails          │  (user@domain.com)
└──────────┬───────────┘
           │
     ┌─────┴──────┐
     │  Clean?    │
     ├─── YES ────►  Store original content
     │
     └─── NO ─────►  Replace violations with [ EXTERNAL ROUTING BLOCKED ]
                     Store sanitized content (isScreened = true)
                     Increment sender's chatStrikes
                     │
                     └── If strikes >= 3 → shadowBannedUntil = now + 48h
                                           Reset strikes to 0
```

**Recipient sees:** The sanitized message (blocked sections replaced).
**Sender sees:** A red warning banner with remaining strikes.
**Shadowbanned user:** Gets HTTP 403 on all message sends with hours remaining.

### 6.4 72-Hour Extension (Logistics Tariff)

```
At 24h remaining mark:
┌──────────────────────┐
│ User A clicks         │
│ "REQUEST EXTENSION"   │──► Stripe Checkout ($3.00)
└──────────┬───────────┘         │
           │                     │ Payment success
           ▼                     ▼
┌──────────────────────┐   ┌──────────────────────┐
│ System message        │   │ Match updated:        │
│ injected into chat    │   │ extensionRequestedBy  │
│ for User B            │   │ extensionUser1Paid    │
└──────────────────────┘   └──────────────────────┘
           │
           ▼
┌──────────────────────┐
│ User B sees           │
│ "ACCEPT EXTENSION"    │──► Stripe Checkout ($3.00)
│ button                │         │
└──────────┬───────────┘         │ Payment success
           │                     ▼
           │              ┌──────────────────────┐
           │              │ expiresAt += 72h      │
           │              │ extensionApplied=true  │
           │              └──────────────────────┘
           │
    If B ignores / match expires:
           │
           ▼
┌──────────────────────┐
│ Cron job auto-refunds │
│ User A's $3.00        │
└──────────────────────┘
```

### 6.5 Subscription (Season Pass)

```
┌────────────┐    ┌──────────────┐    ┌─────────────┐
│ Onboarding │───►│  /subscribe  │───►│ Stripe      │
│ complete   │    │  ($90 / 90d) │    │ Checkout    │
└────────────┘    └──────────────┘    └──────┬──────┘
                                              │
                              ┌────────────────┤
                              │ Webhook         │ Dev Mode
                              ▼                 ▼
                   ┌──────────────┐   ┌──────────────┐
                   │ subscription │   │ subscription │
                   │ Status=ACTIVE│   │ Status=ACTIVE│
                   │ via webhook  │   │ (instant)    │
                   └──────────────┘   └──────────────┘
```

**Gate enforcement:**
- `/api/feed` returns `subscriptionActive: false` → feed UI shows paywall
- `/api/messages` POST checks `subscriptionStatus` before allowing sends
- Default `subscriptionStatus = "NONE"` passes in dev mode (treat as active)

### 6.6 Joint Exit (30% Refund)

```
┌──────────┐                         ┌──────────┐
│  User A  │                         │  User B  │
│ (in person together)               │          │
└────┬─────┘                         └────┬─────┘
     │                                    │
     │  POST /api/joint-exit              │  POST /api/joint-exit
     │  → generates 8-char code           │  → generates 8-char code
     │  → renders QR code                 │  → renders QR code
     │                                    │
     │  Shows QR + code to B              │  Shows QR + code to A
     │                                    │
     │  Enters B's code                   │  Enters A's code
     │  PATCH /api/joint-exit             │
     ▼                                    │
┌─────────────────────┐                   │
│ Server verifies:    │                   │
│ 1. Code is valid    │                   │
│ 2. They matched     │                   │
│ 3. Process refund:  │                   │
│    30% × $90 = $27  │                   │
│    to BOTH users    │                   │
│ 4. Delete BOTH      │                   │
│    accounts + data  │                   │
└─────────────────────┘                   │
```

### 6.7 Reliability Score System

Every user starts at **100**. Score affects feed ranking (higher = shown first).

| Event | Score Impact |
|-------|-------------|
| Match expires — neither tried to schedule | −10 both |
| Match expires — one tried, other didn't | −3 (tried) / −10 (didn't) |
| Match expires — both tried to schedule | −3 both |
| Candidate has tags matching your strong prefs | −15 feed rank (soft) |

---

## 7. User-Facing Pages

| Route | Component Type | Purpose |
|-------|---------------|---------|
| `/` | Server | Auth check → redirect to `/feed` or `/onboarding` |
| `/onboarding` | Client | 6-step wizard: identity, personality (4 axes), values, preferences (2-tier), video, review |
| `/activated` | Client | Post-onboarding confirmation screen |
| `/subscribe` | Client | Season Pass paywall ($90 / 90 days) |
| `/feed` | Client | One-at-a-time profile cards with blurred video, PASS/ENDORSE |
| `/matches` | Client | Active match list with live countdown timers |
| `/chat/[matchId]` | Client | Real-time chat with dynamic blur, extension UI, screening alerts |
| `/protocol/[matchId]` | Client | Set meeting date/time/location |
| `/debrief/[matchId]` | Client | Post-meeting feedback form |
| `/profile` | Client | Stats dashboard (reliability score, match history) |
| `/operator-config` | Client | Full settings editor + joint exit link |
| `/joint-exit` | Client | QR code generation, code entry, mutual deletion |

---

## 8. Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Database connection string |
| `STRIPE_SECRET_KEY` | Prod | Stripe server-side API key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Prod | Stripe client-side key |
| `STRIPE_WEBHOOK_SECRET` | Prod | Webhook signature verification |
| `EXTENSION_FEE_CENTS` | No | Extension fee (default: 300 = $3) |
| `SEASON_PASS_CENTS` | No | Season Pass fee (default: 9000 = $90) |
| `NEXT_PUBLIC_APP_URL` | No | App URL for Stripe redirects (default: localhost:3000) |
| `BLOB_READ_WRITE_TOKEN` | Prod | Vercel Blob storage token for video uploads |
| `NEXT_PUBLIC_PUSHER_KEY` | Prod | Pusher app key (real-time chat) |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Prod | Pusher cluster region |
| `PUSHER_APP_ID` | Prod | Pusher app ID |
| `PUSHER_SECRET` | Prod | Pusher secret key |
| `CRON_SECRET` | Yes | Bearer token for cron endpoint auth |

**Graceful degradation:** All external services (Stripe, Pusher, Vercel Blob) return `null` when keys are missing, and the app falls back to dev-mode behavior (instant actions, polling, local storage).

---

## 9. Background Jobs

| Job | Schedule | Endpoint | Logic |
|-----|----------|----------|-------|
| Match Expiration | Every minute | `GET /api/cron/expire-matches` | Expire `ACTIVE` matches past `expiresAt`, apply asymmetric reliability penalties, auto-refund unaccepted extensions, expire `PROTOCOL_SET` matches 48h past deadline |

Configured via `vercel.json` for Vercel Cron Jobs. Protected by `CRON_SECRET` Bearer token.

---

## 10. Security Considerations

| Concern | Current Implementation | Production Recommendation |
|---------|----------------------|--------------------------|
| **Authentication** | Cookie-based UUID (mock) | Replace with NextAuth.js / Clerk / Supabase Auth with JWT |
| **Authorization** | Per-route `getCurrentUserId()` check | Add middleware-level auth guard |
| **Chat moderation** | Regex-based screening (phones, socials, URLs, emails) | Add LLM-based semantic screening for evasion attempts (e.g., "five five five...") |
| **Rate limiting** | 20 daily swipes (app-level) | Add API-level rate limiting (e.g., Upstash Ratelimit) |
| **Payments** | Stripe Checkout with webhook verification | Ensure idempotency keys on refund operations |
| **Data deletion** | Cascade delete on account removal | Add soft-delete with 30-day retention before hard purge |
| **CSRF** | SameSite cookies | Add CSRF tokens for state-changing operations |
| **Input validation** | Basic type checks | Add Zod schema validation on all API inputs |

---

## 11. Deployment Architecture (Vercel)

```
┌──────────────────────────────────────────────────┐
│                     Vercel                        │
│                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────┐│
│  │ Next.js SSR │  │ API Routes   │  │ Cron Job ││
│  │ (Pages)     │  │ (Serverless) │  │ (1/min)  ││
│  └──────┬──────┘  └──────┬───────┘  └────┬─────┘│
│         │                │               │       │
│         └────────────────┼───────────────┘       │
│                          │                        │
└──────────────────────────┼────────────────────────┘
                           │
              ┌────────────┼────────────────┐
              │            │                │
        ┌─────▼────┐ ┌────▼─────┐  ┌───────▼──────┐
        │ Database │ │  Stripe  │  │    Pusher    │
        │ (Neon /  │ │ Payments │  │  WebSockets  │
        │ Supabase)│ │          │  │              │
        └──────────┘ └──────────┘  └──────────────┘
              │
        ┌─────▼──────┐
        │ Vercel Blob│
        │ (Videos)   │
        └────────────┘
```

### Production Database

Switch `prisma/schema.prisma` datasource from `sqlite` to `postgresql` and set `DATABASE_URL` to a managed Postgres instance (Neon, Supabase, or PlanetScale).

---

## 12. User Journey Flow

```
New User                                  Returning User
   │                                           │
   ▼                                           ▼
/onboarding ──────────────────────────►  / (auth check)
   │                                           │
   │ 6 steps:                                  │
   │ 1. Name, Age (28+), Gender                │
   │ 2. Personality (4 axes)                   │
   │ 3. Values (religion, politics, kids)      │
   │ 4. Preferences (2-tier: hard + soft)      │
   │ 5. 15-sec video candid                    │
   │ 6. Review & submit                        │
   │                                           │
   ▼                                           │
/activated                                     │
   │                                           │
   ▼                                           │
/subscribe ($90 Season Pass) ◄─────────────────┤
   │                                           │
   ▼                                           ▼
/feed ◄────────────────────────────────────► /matches
   │ Browse profiles                         │ View active matches
   │ 20/day limit                            │ Live countdown timers
   │ Focus Mode (3+ matches = locked)        │
   │                                         ▼
   │                                    /chat/[matchId]
   │                                         │ Real-time messaging
   │                                         │ Content screening
   │                                         │ Extension requests
   │                                         │
   │                                         ▼
   │                                    /protocol/[matchId]
   │                                         │ Schedule 20-min meeting
   │                                         │
   │                                         ▼
   │                                    /debrief/[matchId]
   │                                         │ Post-meeting feedback
   │                                         │
   ▼                                         ▼
/operator-config ──────────────────────► /joint-exit
   │ Edit preferences                    │ QR code exchange
   │ Toggle Ghost Mode                   │ Mutual account deletion
   │ Delete account                      │ 30% refund ($27 each)
   │                                     │
   ▼                                     ▼
/profile                              "Go live your life."
   │ Stats dashboard
   │ Reliability score
   │ Match history
```

---

## 13. Known Limitations & Technical Debt

| Item | Severity | Description |
|------|----------|-------------|
| Mock auth | High | Cookie-based UUID with no encryption or session management |
| No input validation library | Medium | API routes use manual type checking; should adopt Zod |
| SQLite in dev | Low | Schema is Prisma-portable; switch to PostgreSQL for prod |
| No tests | High | Zero unit/integration/e2e tests |
| Regex-only chat screening | Medium | Sophisticated users can evade with creative spelling |
| No email/SMS verification | High | No identity verification on signup |
| Video storage | Medium | Local fallback stores to `public/uploads`; needs CDN |
| Single-region | Low | Pusher cluster is hardcoded to `us2` |
| No admin panel | Medium | No way to moderate users, review flagged messages, or manage disputes |
| Cron granularity | Low | Match expiration runs every minute; could batch more efficiently |
| No pagination | Medium | Feed returns max 20; matches/messages load all at once |
| No GDPR tools | Medium | No data export endpoint; deletion is hard-delete only |

---

## 14. Recommended Next Steps for Production

1. **Auth:** Integrate NextAuth.js or Clerk for proper authentication with email verification
2. **Validation:** Add Zod schemas to all API routes
3. **Testing:** Set up Vitest for unit tests + Playwright for e2e
4. **Database:** Migrate to managed PostgreSQL (Neon/Supabase) with connection pooling
5. **Admin panel:** Build internal dashboard for user management, dispute resolution, and metrics
6. **AI screening:** Add an LLM layer (GPT-4 / Claude) for semantic chat screening
7. **Monitoring:** Integrate Sentry for error tracking, Vercel Analytics for usage
8. **Rate limiting:** Add Upstash Ratelimit middleware for API protection
9. **CDN:** Serve uploaded videos through a CDN (Cloudflare R2 or Vercel Blob)
10. **Mobile:** Consider React Native/Expo wrapper or a PWA configuration
