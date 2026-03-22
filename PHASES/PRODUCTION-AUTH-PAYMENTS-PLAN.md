# DMSuite — Production, Authentication & Payments Master Plan

> **Created:** March 22, 2026  
> **Scope:** Take DMSuite from local dev to a production-ready SaaS  
> **Stack Decisions:** Supabase (auth + DB + storage) · Vercel (hosting) · Flutterwave (payments)

---

## 1. Platform Assessment

DMSuite currently runs as a client-side-only Next.js app. All 250+ tools, stores, and AI integrations work via localStorage/sessionStorage with no user accounts, no database, and no payment system. The codebase is mature (106 sessions of development, 50% tool coverage), TypeScript strict, zero build errors, and ready for backend integration.

**What exists today:**
- 9 API routes (all AI-related — chat, Chiko, image analysis, resume parsing)
- 21 Zustand stores (all client-side persistence via localStorage/sessionStorage)
- PWA shell (manifest + service worker registration)
- SEO setup (sitemap, robots, Open Graph, JSON-LD)
- Zambian locale defaults already baked in (ZMW currency, +260, 16% VAT)

**What we're building:**
- User authentication (signup, login, password reset, email verification)
- PostgreSQL database via Supabase (user profiles, credits, transactions)
- Credit-based usage system for AI operations
- Mobile money payment processing (Airtel Money + MTN MoMo) via Flutterwave
- Route protection middleware
- Vercel deployment

---

## 2. Why Supabase + Vercel + Flutterwave

### Supabase (Authentication + Database + Storage)
- **Industry standard** for Next.js apps — official SSR helpers, edge-compatible
- **Built-in auth** with JWT tokens, email/password, magic links, social login
- **PostgreSQL** with Row Level Security (RLS) — data isolation per user out of the box
- **Storage** for user uploads (logos, images, project files) — replaces localStorage blobs
- **Free tier** generous enough for development and early users (50K monthly active users, 500MB DB, 1GB storage)
- **Zambia-friendly** — no geo-restrictions, works globally

### Vercel (Hosting)
- Built by the creators of Next.js — zero-config deployment
- Edge network for fast global delivery
- Serverless functions for our API routes
- Preview deployments for every git push
- Free tier handles our initial traffic

### Flutterwave (Payment Processing)
- **Supports Zambian mobile money** — both Airtel Money and MTN MoMo
- **STK Push flow** — user enters phone number, gets PIN prompt on their phone, payment confirmed automatically
- **Also supports cards** for future expansion (Visa/Mastercard)
- **African-first** — built for this market, understands mobile money UX
- **Developer-friendly** — REST API, webhooks, test mode
- **Cheaper alternative to direct carrier integration** — one integration handles multiple carriers
- **Why not direct Airtel/MTN APIs?** — Each carrier requires separate business agreements, separate APIs, separate compliance. Flutterwave abstracts all of this into one clean integration. When we expand to other countries, we just enable new payment methods in the Flutterwave dashboard.

---

## 3. Authentication Architecture

### Token Flow (JWT-based via Supabase)
```
User signs up/logs in
  → Supabase issues JWT access token + refresh token
  → Tokens stored in HTTP-only cookies (secure, not localStorage)
  → Every API request includes token automatically
  → Supabase RLS checks token's user_id on every DB query
  → Refresh token auto-renews sessions (no manual re-login)
```

### Auth Pages
- `/auth/login` — Email + password login, "Remember me" option
- `/auth/signup` — Name, email, password, phone (for mobile money), agree to terms
- `/auth/reset-password` — Email-based password reset flow
- `/auth/callback` — Supabase redirect handler (email verification, OAuth)
- `/auth/verify` — Email verification confirmation page

### Route Protection
- **Public routes:** `/auth/*`, `/` (redirects to dashboard anyway)
- **Protected routes:** `/dashboard`, `/tools/*`, `/api/chat/*`, `/api/chiko/*`
- **Middleware.ts** at project root intercepts every request, checks for valid Supabase session, redirects unauthenticated users to `/auth/login`

### Session Management
- Supabase `@supabase/ssr` package handles cookie-based sessions
- Server components read session from cookies (no client-side token exposure)
- Client components use `createBrowserClient()` for real-time subscriptions
- Auto-refresh keeps users logged in across tabs and page reloads

---

## 4. Database Schema

### Tables

**profiles** (extends Supabase auth.users)
- `id` (uuid, FK to auth.users.id)
- `full_name` (text)
- `phone` (text) — for mobile money
- `avatar_url` (text, nullable)
- `credits` (integer, default 50) — free starter credits
- `plan` (text: 'free' | 'starter' | 'pro' | 'agency')
- `plan_expires_at` (timestamptz, nullable)
- `created_at`, `updated_at`

**credit_transactions**
- `id` (uuid)
- `user_id` (uuid, FK to profiles)
- `amount` (integer) — positive = added, negative = spent
- `balance_after` (integer) — running balance
- `type` (text: 'purchase' | 'usage' | 'bonus' | 'refund')
- `description` (text) — "Used Logo Generator", "Purchased 500 credits", etc.
- `tool_id` (text, nullable) — which tool consumed credits
- `payment_ref` (text, nullable) — Flutterwave transaction reference
- `created_at`

**payments**
- `id` (uuid)
- `user_id` (uuid, FK to profiles)
- `flw_ref` (text) — Flutterwave reference
- `flw_tx_id` (text) — Flutterwave transaction ID
- `amount` (numeric) — ZMW amount charged
- `credits_purchased` (integer)
- `payment_method` (text: 'airtel_money' | 'mtn_momo' | 'card')
- `phone_number` (text) — mobile money phone
- `status` (text: 'pending' | 'successful' | 'failed' | 'refunded')
- `created_at`

**All tables have RLS policies** — users can only read/write their own data.

---

## 5. Credit System

### How Credits Work
- Every user starts with **50 free credits** on signup
- AI operations cost credits (see pricing below)
- When credits hit 0, AI tools show "Buy credits" prompt — non-AI tools remain free
- Credits never expire
- Credit balance shown in the top bar next to user avatar

### Credit Pricing per AI Operation
| Operation | Credits | Why |
|---|---|---|
| AI Chat message (Chiko/general) | 1 | Low-cost, high-frequency |
| Resume AI revision | 3 | Medium complexity |
| Business card AI design | 5 | Full design generation |
| Sales book AI fill | 3 | Document intelligence |
| Invoice AI fill | 3 | Document intelligence |
| Image analysis | 2 | Vision API call |
| Logo AI generation | 5 | Complex SVG generation |
| PDF/DOCX parsing | 1 | File extraction |

### Credit Packs (Mobile Money Purchase)
| Pack | Credits | Price (ZMW) | Per Credit |
|---|---|---|---|
| Starter | 100 | K25 | K0.25 |
| Popular | 500 | K100 | K0.20 |
| Pro | 1,500 | K250 | K0.17 |
| Agency | 5,000 | K700 | K0.14 |

### Monthly Plans (Future — Phase 2)
For now, we start with credit packs only. Monthly subscriptions come later when we have enough users to justify recurring billing complexity.

---

## 6. Payment Flow (Mobile Money via Flutterwave)

### User Experience
```
1. User clicks "Buy Credits" (from top bar or empty-credits prompt)
2. Modal shows credit packs with prices in ZMW
3. User selects a pack
4. User enters their mobile money phone number (+260...)
5. User selects provider (Airtel Money or MTN MoMo)
6. User clicks "Pay Now"
7. Our server initiates Flutterwave charge
8. User receives PIN prompt on their phone
9. User enters PIN on their phone
10. Flutterwave webhook confirms payment
11. Our webhook handler adds credits to user's account
12. User sees updated credit balance immediately
```

### Technical Flow
```
Client: POST /api/payments/initiate
  → Body: { packId, phoneNumber, provider }
  → Server validates user session + pack
  → Server calls Flutterwave "Charge" API (mobile_money_zambia)
  → Returns { status: 'pending', message: 'Check your phone' }

Flutterwave sends STK push to user's phone
User enters PIN

Flutterwave: POST /api/payments/webhook
  → Verifies webhook signature (FLUTTERWAVE_SECRET_HASH)
  → Checks transaction status via Flutterwave verify API
  → If successful: adds credits to profile, logs transaction
  → If failed: logs failure, no credits added

Client polls: GET /api/payments/status?ref=xxx
  → Returns current payment status
  → When successful, client refreshes credit balance
```

### Security
- Webhook signature verification on every callback
- Double-check via Flutterwave transaction verify API (never trust webhook alone)
- All amounts validated server-side (client can't choose arbitrary credit amounts)
- Rate limiting on payment initiation (5 per hour per user)
- Phone number validation (+260 format, 10 digits)

---

## 7. Implementation Steps (Ordered)

### Step 1: Install Dependencies
```
npm install @supabase/supabase-js @supabase/ssr
```
That's it for auth/DB. Flutterwave is a REST API — no SDK needed.

### Step 2: Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (server-only, for admin operations)

# Flutterwave
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxx (server-only)
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxx (could be public, but we keep server-side)
FLUTTERWAVE_SECRET_HASH=my-webhook-hash (server-only, for webhook verification)

# Existing (already in use)
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
NEXT_PUBLIC_SITE_URL=https://dmsuite.app
```

### Step 3: Supabase Client Utilities
- `src/lib/supabase/client.ts` — Browser client (for client components)
- `src/lib/supabase/server.ts` — Server client (for API routes and server components)
- `src/lib/supabase/middleware.ts` — Middleware client (for route protection)

### Step 4: Database Migration
- SQL file with all table definitions, RLS policies, and triggers
- `handle_new_user()` trigger — auto-creates profile with 50 free credits on signup
- Run via Supabase dashboard SQL editor or CLI

### Step 5: Auth Pages
- Clean, dark-themed forms matching DMSuite design language
- Electric-lime green accents, Inter font
- Mobile-responsive
- Error handling with clear messages
- Loading states during auth operations

### Step 6: Middleware
- `middleware.ts` at project root
- Checks for valid session on protected routes
- Redirects to `/auth/login` if no session
- Passes through for public routes and static assets

### Step 7: Wire Auth into Existing UI
- Add user avatar + credit balance to TopBar
- Add "Sign Out" to user menu
- Show user name in Sidebar
- Gate AI operations behind credit checks
- Add credit purchase modal

### Step 8: Payment API Routes
- `POST /api/payments/initiate` — Start mobile money charge
- `POST /api/payments/webhook` — Flutterwave callback handler
- `GET /api/payments/status` — Check payment status

### Step 9: Credit Deduction in AI Routes
- Wrap existing AI routes with credit check
- Deduct credits before making AI API call
- Refund credits if AI call fails
- Return 402 (Payment Required) when credits exhausted

### Step 10: Vercel Deployment
- Connect GitHub repo to Vercel
- Set environment variables in Vercel dashboard
- Configure custom domain (dmsuite.app)
- Test production build

---

## 8. File Structure (New Files)

```
src/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx          # Login form
│   │   ├── signup/page.tsx         # Registration form
│   │   ├── reset-password/page.tsx # Password reset request
│   │   ├── callback/route.ts      # Supabase auth callback handler
│   │   ├── verify/page.tsx        # Email verification page
│   │   └── layout.tsx             # Auth pages layout (centered, no sidebar)
│   └── api/
│       └── payments/
│           ├── initiate/route.ts   # Start mobile money charge
│           ├── webhook/route.ts    # Flutterwave webhook
│           └── status/route.ts     # Payment status check
├── components/
│   ├── auth/
│   │   └── AuthForm.tsx           # Shared form component
│   └── dashboard/
│       ├── UserMenu.tsx           # Avatar + dropdown (sign out, settings)
│       └── CreditBalance.tsx      # Credit display + buy button
│       └── CreditPurchaseModal.tsx # Credit pack selection + mobile money form
├── hooks/
│   └── useUser.ts                 # Auth state hook (user, loading, credits)
├── lib/
│   └── supabase/
│       ├── client.ts              # Browser Supabase client
│       ├── server.ts              # Server Supabase client
│       ├── middleware.ts          # Middleware Supabase client
│       └── credits.ts            # Credit check/deduct/add helpers
├── middleware.ts                   # Root middleware (route protection)
```

---

## 9. What Stays Free vs. What Costs Credits

**Always Free (no credits needed):**
- Dashboard browsing and search
- All non-AI tool features (manual editing, templates, exports)
- Resume builder (manual entry + template selection)
- Sales book designer (manual entry + template selection)
- Invoice designer (manual entry + template selection)
- Business card wizard (manual entry)
- Theme switching, settings, preferences

**Costs Credits (AI operations):**
- Any AI generation (chat, revisions, designs)
- AI file parsing (PDF/DOCX extraction)
- Image analysis
- Chiko AI assistant messages
- AI-powered template suggestions

This ensures the platform is useful even without credits, encouraging users to buy when they experience AI value.

---

## 10. Security Checklist

- JWT tokens in HTTP-only cookies (not localStorage — prevents XSS theft)
- Row Level Security on every table (users only access own data)
- Server-side credit validation (client can't fake credit balance)
- Webhook signature verification (prevents fake payment confirmations)
- Double verification via Flutterwave API (belt and suspenders)
- Rate limiting on payment endpoints
- Phone number validation and sanitization
- CSRF protection via SameSite cookies
- Environment variables never exposed to client (except NEXT_PUBLIC_ prefixed)
- Input sanitization on all user inputs
- No raw SQL — Supabase client handles parameterized queries

---

## 11. Migration Strategy (localStorage → Supabase)

**Phase 1 (Now):** Auth + credits work. Existing localStorage stores continue working. Users log in but their tool data stays local. This is fine for launch.

**Phase 2 (Later):** Gradually migrate Zustand stores to save/load from Supabase. Each tool gets a "projects" table. Users can save, name, and reload projects. localStorage becomes offline cache that syncs when online.

This two-phase approach means we ship auth+payments without touching any of the existing 21 stores or 99 working tool workspaces.

---

## 12. Vercel Configuration Notes

- `next.config.ts` already has `serverExternalPackages` for pdf-parse and pdfjs-dist
- Build command: `next build` (already in package.json)
- Output: Automatic (Vercel detects Next.js)
- Environment variables: Set in Vercel dashboard (Settings → Environment Variables)
- Domain: Add custom domain in Vercel dashboard
- Preview branches: Every PR gets a preview URL automatically

---

## Summary

This plan takes DMSuite from a local-only app to a production SaaS with:
1. **Secure authentication** (Supabase JWT + cookies + RLS)
2. **Credit-based monetization** (fair, transparent, no subscriptions yet)
3. **Mobile money payments** (Airtel + MTN via Flutterwave — the Zambian way)
4. **Zero disruption** to existing features (all 99 working tools untouched)
5. **Industry-standard stack** (Next.js + Supabase + Vercel — used by thousands of production apps)
6. **Security-first** (OWASP-compliant, webhook verification, RLS, HTTP-only cookies)
