---
phase: 05-video-tutorials
plan: 02
subsystem: routes, navigation, i18n
tags: [remix, route, navigation, i18n, video, public]

# Dependency graph
requires:
  - phase: 05-01
    provides: "Video.category field persisted by admin CRUD"
provides:
  - "Public /videos listing route"
  - "Category filter buttons with URL-persisted state"
  - "YouTube thumbnail cards linking to external videos"
  - "Navigation link to /videos (desktop + mobile)"
affects: [07-i18n-completion]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "i18next.getLocale(request) for server-side locale detection (matches books._index.tsx)"
    - "useSearchParams for filter state persistence"

key-files:
  created:
    - app/routes/videos._index.tsx
  modified:
    - components/navs/navList.tsx
    - public/locales/el/common.json
    - public/locales/en/common.json

key-decisions:
  - "Server uses i18next.getLocale(request) instead of getLanguageFromRequest(searchParams) — matches the books._index.tsx pattern, reads from cookie not URL, matches user's chosen language"
  - "Filter value is the Greek canonical category name (stored in DB); English button labels are derived by index pairing with Category_En. No need for EN→EL lookup since getLocalizedContent does not translate the category field (admin stores category only in the dedicated field, not in translation JSON)"
  - "Added i18n keys in this plan rather than deferring to Phase 7 — avoids shipping English fallback text in the Greek UI for a user-facing page"
  - "Thumbnail image wrapped in external YouTube link for easier click target"

patterns-established:
  - "Public listing route with client-side category filter via useSearchParams"

requirements-completed: [VID-02]

# Metrics
completed: 2026-04-21
---

# Phase 5 Plan 02: Public Videos Route Summary

**Created public /videos route with category filter and YouTube thumbnail grid; added Videos navigation link in desktop and mobile menus.**

## Accomplishments
- New public route `app/routes/videos._index.tsx` — no auth required
- Loader fetches all videos via `getAllVideos()`, applies `getLocalizedList` using locale from i18next cookie
- Category filter: row of pill buttons ("All" + each available category) with active state styling, URL-synced via `useSearchParams`
- Video grid: 1/2/3 column responsive layout with YouTube thumbnail, title, creator name, category badge, description snippet, and "Watch on YouTube" link opening in a new tab
- Graceful empty states for (a) no videos at all and (b) filter returns no matches (with "Show all" reset button)
- Fallback SVG icon when YouTube URL cannot produce a video ID
- Navigation link "Βίντεο"/"Videos" added to both desktop and mobile menus in `components/navs/navList.tsx`
- Translation keys (`nav.videos`, `videos.pageTitle`, `videos.pageSubtitle`, `videos.allCategories`, `videos.watchOnYouTube`, `videos.noVideosAtAll`, `videos.noVideosInCategory`, `videos.showAll`) added to both `el` and `en` locale files

## Task Commits

No commits made per user instructions (user's durable feedback: "Never commit code without user review first"). All changes unstaged.

1. **Task 1: Create public videos listing route with category filtering and add nav link** — (no commit)
2. **Task 2: Human verification checkpoint** — deferred to user

## Files Created/Modified
- `app/routes/videos._index.tsx` *(new)* — public listing page with loader, category filter, video grid, empty states, YouTube-id extractor
- `components/navs/navList.tsx` — added Videos NavLink to desktop list (after testYourself, before qa) and mobile list (same ordering)
- `public/locales/el/common.json` — added `nav.videos` + 7 `videos.*` keys
- `public/locales/en/common.json` — added `nav.videos` + 7 `videos.*` keys

## Decisions Made
- **Server-side locale source**: used `i18next.getLocale(request)` (reads cookie) instead of the plan's `getLanguageFromRequest(searchParams)` (reads `?lang=`). Matches the `app/routes/books._index.tsx` pattern established in the v1.0 milestone and gives correct translations for users who set their language via the language indicator without adding `?lang=en` to the URL.
- **Filter value = Greek canonical name**: buttons submit the Greek category name (matching DB storage). English labels are paired by position in `Category_En.byId`. This avoids an EN→EL lookup map because `getLocalizedContent` does not translate the `category` field for videos (admin stores category in the dedicated field, not inside the `translation` JSON).
- **Added i18n keys now** instead of deferring the keys to Phase 7. The plan said "add translation keys in Phase 7", but shipping `t("videos.pageTitle", "Video Tutorials")` with no Greek key would put English text into the default Greek UI. Added minimal keys in both locales to avoid that regression.

## Deviations from Plan
- Used `i18next.getLocale` instead of `getLanguageFromRequest` (see above — matches existing pattern in books route).
- Added i18n keys now rather than deferring to Phase 7 (see above — avoids visible English-in-Greek regression).
- Both deviations are documented; neither changes the scope, file list, or verification criteria.

## Issues Encountered
- Pre-existing TypeScript errors in `components/uploadExTabs/uploadBook.tsx` and `uploadTutorial.tsx` — already documented as out-of-scope in Plan 05-01 summary, unchanged here.
- Pre-existing lint warnings on `components/navs/navList.tsx` import order (lines 1, 3) — existed before this plan's edits, not introduced by this work.
- `npx eslint app/routes/videos._index.tsx` reports no errors or warnings on the new file.

## User Setup Required

None — no env vars, migrations, or external service config needed.

## Next Phase Readiness
- `/videos` is now browsable without login; navigation reaches it.
- VID-02 requirement complete (student can browse videos by category).
- Phase 5 goal fully delivered: 05-01 (schema + admin CRUD) + 05-02 (public browse) = video tutorials are end-to-end functional.
- Ready for human verification per plan's blocking checkpoint.
- Phase 7 (i18n completion) should audit these keys but they already cover the basic video page.

## How to Verify (from plan)
1. `npm run dev` → open http://localhost:3000
2. Verify "Βίντεο" link in desktop nav (and mobile hamburger menu)
3. Click it → navigates to `/videos`
4. If videos exist: thumbnails render as a responsive grid
5. Click a category button → only that category's videos remain
6. Click "Όλες" (All) → full list returns
7. Click "Watch on YouTube" → opens YouTube in a new tab
8. Admin creates a new video with a category → appears on `/videos` with badge
9. Edit a video's category in admin → `/videos` reflects the change
10. Toggle language (EL/EN) → page title, empty states, and button labels switch

## Self-Check: PASSED

- New route file exists at `app/routes/videos._index.tsx` (217 lines)
- Nav link present in both desktop and mobile menus
- Both locale files have 8 new keys each, JSON parses cleanly
- No TS or lint issues introduced in changed files
- All must_haves from plan frontmatter satisfied:
  - ✅ "Student can visit /videos and see a listing of video tutorials with thumbnails"
  - ✅ "Student can filter videos by category using clickable category buttons"
  - ✅ "Student can click a video to open it on YouTube"
  - ✅ "Navigation includes a link to the videos page"

---
*Phase: 05-video-tutorials*
*Completed: 2026-04-21*
