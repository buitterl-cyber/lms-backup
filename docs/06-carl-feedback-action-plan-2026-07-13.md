# Action Plan — Carl's LMS Vision (email 2026-07-13)

Source: Carl Uitterlinden's email of 13 Jul 2026 ("Re: Your Dacia MoT is expiring" thread)
plus two attached wireframes, saved at `docs/wireframes/lms-wireframe.html` (desktop:
Manager Dashboard, Learner Home, Course Forum, Instructor View) and
`docs/wireframes/lms-mobile-wireframe.html` (mobile: Learner Home, Course Detail, Forum,
Manager — bottom-tab navigation).

## Carl's asks, distilled

1. **Nudge** — manager reminds a learner who is behind or hasn't started; delivered
   in-app **and** by email. Called out as the #1 gap from his TKA days.
2. **Mobile UI** — first-class phone experience (iOS + Android friendly) at launch.
3. **Radical ease of use** — "so easy anyone can use it"; the wireframes are the
   look-and-feel reference.
4. **Sales website** — public catalogue with promotions, best-seller shortcuts
   (ITIL 4, PRINCE2, Lean Six Sigma), search across ~40,000 courses.
5. **CRM hook** — an inquiry on the sales site auto-creates a deal so sales follows up
   immediately.

The wireframes add (implied scope): manager dashboard with team-progress table +
at-risk alerts + activity heatmap + CSV export; gamification (XP, levels, streaks,
badges, leaderboard); per-course discussion forums (pinned/instructor/anonymous posts,
upvotes) with an AI study assistant grounded in course content; peer reviews;
an instructor portal (course builder, assignments, grading queue, feedback);
module-level course structure with sequential unlock.

## What the platform already has (leverage, don't rebuild)

- `Enrollment.dueAt`, `assignedBy`, `status` — the data for "due in 5 days" already exists.
- `Notification` model with `in_app | email | push` channels + a notifications page —
  only the *delivery* (email transport) and *triggering* (nudge action, schedulers) are missing.
- Team Readiness page (`/team`) + workforce endpoint — the seed of the Manager Dashboard.
- RIYADA AI chat with skill-gap grounding — extend grounding per-course for the
  wireframe's "AI Study Assistant".
- Assessment engine — reusable for instructor assignments/quizzes and peer reviews.
- Reports CSV export, catalog + course player, JWT auth with roles (org_admin,
  compliance_manager) — role model extends to `manager`, `instructor`, `learner`.
- Meilisearch is already in `docker-compose.yml` (unused) — the sales-site search engine.

## Phases

### Phase 1 — Nudge + deadlines (Carl's explicit #1)
- Email transport in the API (nodemailer → Excis mail infra; from a dedicated
  `lms@…` sender — decide mailbox with Bert). ⚠ nodemailer /etc/hosts gotcha
  (see fleet memory) if using the LAN mailcow.
- `POST /workforce/nudge` — manager picks learner(+course); writes an in-app
  Notification and sends the email; audit-logged.
- Nudge buttons on `/team` rows (the wireframe's "Nudge" action + "Send nudge →" alert).
- Scheduled auto-nudges (pm2 cron or Nest scheduler): deadline in ≤5 days & not
  started / < X% progress; inactivity ≥ 2 weeks. Deduped per learner/course/week.
- Surface `dueAt` everywhere ("Due in 5d" chips on my-learning, catalog detail, team table).

### Phase 2 — Mobile-first UI
- Responsive pass over all 17 routes: collapse sidebar to the wireframe's 5-item
  bottom tab bar (Home · Courses · Forum · Manage · Profile) under a breakpoint;
  card layouts stack; tables become cards.
- PWA (manifest, icons, service worker) so it installs to home screen on iOS/Android —
  ship this at launch; evaluate native wrappers (Capacitor) later only if needed.

### Phase 3 — Manager Dashboard (wireframe parity)
- Upgrade `/team`: KPI cards (courses assigned, avg completion, avg time/week, certs),
  per-learner status classification (On Track / Falling Behind / At Risk / Not Started),
  alerts panel, last-active tracking, CSV export, activity heatmap.
- Requires an activity/event table (logins, module completions) — also feeds streaks/XP.

### Phase 4 — Gamification
- Models: XP ledger, levels, streaks, badges/achievements; leaderboard endpoint.
- Award rules server-side on enrollment/completion/forum events.
- Learner home rework toward the wireframe: Continue-learning hero, streak calendar,
  weekly XP, achievements row, latest certificate card.

### Phase 5 — Community: forums, per-course AI, peer reviews
- Forum models (thread, reply, upvote, pin, anonymous flag, instructor badge,
  accepted answer); `/catalog/[id]/forum` + mobile forum screen.
- AI Study Assistant: reuse RIYADA AI with course-scoped grounding + "answers grounded
  in course content" framing.
- Peer reviews: submission → review queue (instructor or peer) using the assessment engine.

### Phase 6 — Instructor portal + native course authoring
- Today all courses are provider-synced (MS Learn). Add native authoring: Course →
  Modules (ordered, lockable) → lessons/quizzes; instructor role + `/instructor` views
  (overview KPIs, course performance table, grading queue, feedback list, announcements).
- Module-level progress replaces the single `percent` for native courses; sequential
  unlock per the mobile Course Detail wireframe.

### Phase 7 — Sales website + CRM hook
- Public marketing/catalogue site (public routes or a thin separate Next app):
  best-seller tiles, promotions, course pages with inquiry/enroll CTAs.
- Wire Meilisearch for instant search; index the catalogue.
- Inquiry form → CRM: decision needed (Excis One Lead API vs. a native deals table vs.
  external CRM). Auto-create the deal + notify sales on submit.
- 40,000 courses requires commercial provider feeds (GO1 etc.) — **blocked on vendor
  credentials**; ITIL 4 / PRINCE2 / Lean Six Sigma are licensed (PeopleCert/Axelos)
  content, not free-catalogue items.

## Decisions needed from Bert / Carl

1. **Branding**: wireframes say "LearnFlow"; the attached logo is Riyada Intelligence.
   Which name ships?
2. **CRM target** for Phase 7 (Excis One Lead vs. other).
3. **Sender mailbox** for nudge emails.
4. **Native apps vs. PWA** at launch (plan assumes PWA first).
5. **Provider/content licensing** for the 40k-course, best-seller catalogue (GO1 or
   similar reseller creds) — commercial, can't be built around.
6. Reply to Carl re Base44: platform is already live at lms.excisone.com; his wireframes
   are being implemented natively (no Base44 needed).
