# DMSuite — PHASE 5: Platform Maturity, Polish & Production Launch

> **Codename:** "Launchpad"
> **Duration:** 4–6 Weeks
> **Goal:** Authentication, database, collaboration, performance optimization, accessibility compliance, full PWA, production deployment, and launch preparation.

---

## Wave 5.1 — Backend & Persistence (Supabase)

### Task 5.1.1 — Supabase setup
**Action:**
- Install: `npm install @supabase/supabase-js @supabase/ssr`
- Create Supabase project
- Configure environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Create Supabase client utility (`src/lib/supabase.ts`)
- Set up RLS (Row Level Security) policies

### Task 5.1.2 — Database schema
**Action — Tables:**
| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (name, avatar, company, role) |
| `projects` | Saved design projects (name, tool_id, data JSON, thumbnail) |
| `brand_kits` | Saved brand kits (colors, fonts, logos, guidelines) |
| `templates` | User-saved templates (shareable) |
| `assets` | Uploaded files (images, logos, fonts) |
| `conversations` | AI chat history (migrate from localStorage) |
| `preferences` | User preferences (migrate from localStorage) |
| `usage` | API usage tracking (tokens, requests, exports) |
| `subscriptions` | Subscription tier + payment info |

### Task 5.1.3 — Authentication system
**Action:**
- Auth methods: Email/password, Google OAuth, GitHub OAuth
- Auth UI: Login page, Register page, Forgot password
- Auth middleware (protect API routes)
- Session management with Supabase SSR
- Protected routes (redirect to login if not authenticated)
- User menu in TopBar (profile, settings, logout)
- Avatar upload in profile

### Task 5.1.4 — Project save/load system
**Action:**
- Auto-save every 30 seconds (when changes detected)
- Manual save (`Ctrl+S`)
- Project gallery on dashboard (recent projects section)
- Open project → restore full state (layers, styles, content)
- Project metadata: name, tool type, created/modified dates, thumbnail
- Duplicate project
- Delete project (soft delete → 30-day recovery)
- Share project (public URL with read-only view)

### Task 5.1.5 — Asset library
**Action:**
- Upload images, logos, fonts to Supabase Storage
- Asset browser modal (like StockImagePicker but for user uploads)
- Drag-drop upload
- Asset tagging and search
- Usage tracking (which projects use which assets)
- Storage quota display
- Folder organization

### Task 5.1.6 — Migrate localStorage to Supabase
**Action:**
- Migrate chat conversations from `useChatStore` localStorage to `conversations` table
- Migrate preferences from `usePreferencesStore` localStorage to `preferences` table
- Migrate sidebar state (optional — keep local for performance)
- Keep localStorage as offline fallback
- Sync on reconnect

---

## Wave 5.2 — Brand Kit & Consistency Engine

### Task 5.2.1 — Brand Kit Manager
**File:** New `src/components/BrandKitManager.tsx`
**Action:**
- Create/edit brand kits: colors (primary, secondary, accent, neutrals), fonts (heading, body, accent), logos (primary, secondary, icon), guidelines (tone of voice, imagery style)
- Multiple brand kits per user
- Set active brand kit
- Brand kit picker in every workspace sidebar

### Task 5.2.2 — Part-Edit / Consistency Engine
**Action:**
- When brand kit is active, all new designs use brand colors/fonts by default
- "Apply Brand" button on any workspace → replaces colors/fonts with brand kit
- Style locking: lock specific properties so AI can't change them
- Cross-tool consistency: style changes in one tool can propagate to others (opt-in)
- Version history per design (snapshot before each AI revision)

### Task 5.2.3 — Template system
**Action:**
- Save any design as a template
- Template gallery per tool (user templates + community templates)
- Template categories and tags
- One-click template application
- Template sharing (public URL)

---

## Wave 5.3 — Collaboration

### Task 5.3.1 — Team workspaces
**Action:**
- Create team/organization
- Invite members (email invite)
- Roles: Owner, Admin, Editor, Viewer
- Shared project folders
- Team brand kits (shared across team)

### Task 5.3.2 — Commenting system
**Action:**
- Click anywhere on canvas to leave a comment
- Comment thread (replies)
- Resolve/unresolve comments
- @mention team members
- Comment notification badges

### Task 5.3.3 — Version history
**Action:**
- Auto-save creates version snapshots
- Browse version history timeline
- Preview any version
- Restore to any version
- Compare two versions side-by-side
- Named versions (manual snapshots)

### Task 5.3.4 — Sharing & export
**Action:**
- Share link (view-only, comment, edit permissions)
- Password-protected links
- Expiring links
- Download permissions control
- Embed code for websites
- Present mode (full-screen shareable URL)

---

## Wave 5.4 — Performance & Optimization

### Task 5.4.1 — Code splitting & lazy loading
**Action:**
- All workspace components lazy-loaded (Phase 1 Task 1.3.1 — verify)
- Route-based code splitting (automatic with Next.js App Router)
- Component-level splitting for large modals
- Dynamic import for heavy libraries (`@ffmpeg`, `pptxgenjs`, `jspdf`, `pdf-lib`)
- Tree-shaking audit (remove unused code)

### Task 5.4.2 — Image optimization
**Action:**
- Use Next.js `<Image>` for all static/local images
- Configure image CDN (Vercel Image Optimization or Cloudinary)
- Responsive image srcsets
- WebP/AVIF format with fallbacks
- Blur placeholder for images during load

### Task 5.4.3 — Caching strategy
**Action:**
- API route caching headers (Cache-Control)
- SWR or React Query for data fetching (if backend added)
- Service worker cache for static assets
- Stale-while-revalidate for tool definitions
- Browser cache for stock images (already has headers)

### Task 5.4.4 — Bundle analysis
**Action:**
- Run `@next/bundle-analyzer`
- Identify and eliminate large dependencies
- Target: initial JS < 200KB
- Monitor with Lighthouse CI
- Web Vitals tracking (LCP, FID, CLS, INP)

### Task 5.4.5 — Canvas performance
**Action:**
- Use `requestAnimationFrame` for all canvas renders (eliminate redundant paints)
- Implement dirty region rendering (only repaint changed areas)
- Off-screen canvas for complex compositions
- Web Workers for heavy image processing
- WebGL acceleration for filters/effects (optional)
- Memory management (dispose unused canvases, revoke blob URLs)

---

## Wave 5.5 — Accessibility (WCAG 2.1 AA Compliance)

### Task 5.5.1 — Full accessibility audit
**Action:**
- Run axe-core on every page
- Fix all critical/serious issues
- Verify with screen reader (NVDA, VoiceOver)
- Test keyboard-only navigation through entire app

### Task 5.5.2 — Screen reader support
**Action:**
- All images have alt text
- All interactive elements have labels
- Landmark roles on all pages (main, nav, aside, header, footer)
- Live regions for dynamic content (`aria-live`)
- Canvas designs have text descriptions
- Layer panel announces changes

### Task 5.5.3 — Reduced motion support
**Action:**
- Respect `prefers-reduced-motion` media query
- Disable animations for users who prefer reduced motion
- Alternative static transitions
- Canvas renders without animation

### Task 5.5.4 — High contrast mode
**Action:**
- Respect `forced-colors` / high contrast mode
- Ensure all interactive elements visible in forced-colors
- Test with Windows High Contrast Mode

### Task 5.5.5 — Focus management finalization
**Action:**
- Skip-to-content link on every page
- Focus trap in all modals/overlays
- Focus restoration on modal close
- Visible focus indicator on all elements
- Tab order matches visual order

---

## Wave 5.6 — Full PWA Implementation

### Task 5.6.1 — Offline mode
**Action:**
- Service worker caches all app shell assets
- Offline page for uncached routes
- Queue API requests when offline → replay on reconnect
- Show "Offline" indicator in TopBar
- Local drafts sync when back online

### Task 5.6.2 — Push notifications
**Action:**
- Request notification permission (non-intrusive prompt)
- Notifications for: export complete, AI generation done, collaboration mentions
- Notification preferences (granular opt-in/out)
- Badge count on app icon

### Task 5.6.3 — App-like experience
**Action:**
- Splash screen on PWA launch
- Status bar color matches theme
- Full-screen mode support
- Back button handling (no browser chrome)
- Share target (receive shared images/text from other apps)
- File handling (open supported file types from OS)

### Task 5.6.4 — Update management
**Action:**
- Detect new service worker version
- Show "Update available" banner
- One-click update (reload with new version)
- Background update download

---

## Wave 5.7 — Production Deployment

### Task 5.7.1 — Environment configuration
**Action:**
- Production environment variables documented
- All API keys in secure env (not committed)
- Rate limiting on all API routes (upstash/ratelimit or custom)
- Request validation on all API routes (zod schemas)
- CORS configuration
- CSP (Content Security Policy) headers

### Task 5.7.2 — Error monitoring
**Action:**
- Sentry integration for error tracking
- Error boundaries on all routes
- API error logging
- Performance monitoring (Web Vitals to Sentry/Analytics)
- User feedback widget for bug reports

### Task 5.7.3 — Analytics
**Action:**
- Page view tracking (privacy-friendly: Plausible or PostHog)
- Feature usage tracking (which tools are popular)
- Export count tracking
- AI usage metrics
- Dashboard: most used tools, peak times, user paths

### Task 5.7.4 — Deployment
**Action:**
- Deploy to Vercel (primary)
- Custom domain configuration
- SSL certificate
- CDN configuration
- Edge functions for API routes where applicable
- Preview deployments for branches

### Task 5.7.5 — Documentation
**Action:**
- User documentation site (tool guides, tutorials, FAQs)
- Developer documentation (API docs, architecture, contributing guide)
- Changelog (version history with features/fixes)
- Video tutorials for key tools

---

## Wave 5.8 — Payment & Subscription

### Task 5.8.1 — Stripe integration
**Action:**
- Install: `npm install stripe @stripe/stripe-js`
- Create pricing page (Free/Pro/Enterprise tiers)
- Stripe Checkout integration
- Subscription management (upgrade/downgrade/cancel)
- Webhook handler for payment events
- Usage-based billing for AI API calls (optional)

### Task 5.8.2 — Feature gating
**Action:**
- Free tier: limited tools, limited exports, watermarked output
- Pro tier: all tools, unlimited exports, no watermark, priority AI
- Enterprise tier: team features, brand kits, API access, SSO
- Upgrade prompts in gated features
- Grace period for expired subscriptions

### Task 5.8.3 — Usage quotas
**Action:**
- AI generation: X per day/month by tier
- Export count: unlimited (Pro+) or limited (Free)
- Storage: GB quota by tier
- Usage dashboard in settings
- Warning notifications at 80%/90%/100% quota

---

## Wave 5.9 — Security

### Task 5.9.1 — Input sanitization
**Action:**
- Sanitize all user text input before rendering (XSS prevention)
- SVG sanitization for AI-generated logos (fix Phase 2 Task 2.4.1)
- File upload validation (type, size, content)
- SQL injection prevention (Supabase handles via parameterized queries)

### Task 5.9.2 — API security
**Action:**
- Rate limiting per user/IP
- Request size limits
- API key rotation capability
- JWT validation on all protected routes
- CSRF protection

### Task 5.9.3 — Data privacy
**Action:**
- GDPR compliance: data export, data deletion
- Privacy policy page
- Cookie consent (if analytics use cookies)
- Data encryption at rest (Supabase default)
- Data encryption in transit (HTTPS enforced)
- No third-party tracking without consent

---

## Deliverables Checklist — Phase 5
- [ ] Supabase fully integrated (auth, database, storage)
- [ ] Login/register/logout flow working
- [ ] Project save/load from cloud
- [ ] Asset library with upload/search
- [ ] Brand kit manager with cross-tool consistency
- [ ] Team collaboration (invite, roles, shared projects)
- [ ] Commenting system on designs
- [ ] Version history with restore
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] PWA: offline mode, push notifications, install prompt
- [ ] Production deployed on Vercel with custom domain
- [ ] Stripe payment integration (Free/Pro/Enterprise)
- [ ] Error monitoring (Sentry) active
- [ ] Analytics tracking active
- [ ] Rate limiting on all API routes
- [ ] Security audit completed
- [ ] User documentation site live
- [ ] Bundle size < 200KB initial JS
- [ ] All Web Vitals in "Good" range
- [ ] Mobile bottom nav fully functional
- [ ] Platform-wide keyboard shortcuts all working
