---
phase: 07-i18n-completion
plan: 03
subsystem: i18n
tags: [i18n, admin, video-upload, wave-2]
requirements: [I18N-01]
dependency-graph:
  requires:
    - "07-01 (locale key foundation — supplies admin.videos.uploadButton, admin.common.uploading, admin.training.replaceContentImage, admin.training.replaceSolutionImage)"
  provides:
    - "Admin video upload form Submit button now actually translates (previously rendered raw key strings due to non-existent admin.videos.createButton/creating references)"
  affects:
    - "components/admin/VideoUploadForm.tsx (1 file, 2 lines changed)"
tech-stack:
  added: []
  patterns:
    - "Reuse-existing-keys convention — admin forms read scoped uploading/uploadButton keys from the locale files; this plan extends that convention to the Videos form by mapping its Submit-button label to the existing admin.videos.uploadButton key"
    - "Cross-namespace fallback — when no admin.videos.uploading key exists with the plan-mandated 'Μεταφόρτωση...'/'Uploading...' text, reuse admin.common.uploading which has those exact values"
key-files:
  created: []
  modified:
    - "components/admin/VideoUploadForm.tsx (-2 / +2)"
decisions:
  - "Used admin.common.uploading instead of admin.videos.uploading because admin.videos.uploading does NOT exist in either locale file (the plan claimed it did at line ~428 but that line is admin.training.uploading). admin.common.uploading exists at line 344 in both locale files with the EXACT Greek/English strings the plan specified ('Μεταφόρτωση...' / 'Uploading...') — so it is the only existing key matching the plan's stated text values. No new keys added (07-01 is the only plan that writes JSON)."
  - "Did NOT modify components/admin/TrainingCard.tsx — it already renders 07-01's new admin.training.replaceContentImage / replaceSolutionImage keys correctly, so no code change was needed."
  - "Did NOT modify components/uploadExTabs/uploadTutorial.tsx — it is a legacy v1.0 component with no Phase 7 v1.1 admin-route consumers, marked OUT OF SCOPE."
metrics:
  duration: "~5min"
  completed-date: "2026-04-25"
  tasks-completed: 1
  files-modified: 1
  keys-added: 0
---

# Phase 7 Plan 03: Admin Video Upload Form i18n Fix Summary

Replaced the two non-existent locale-key references in `components/admin/VideoUploadForm.tsx`'s Submit button (`admin.videos.creating` / `admin.videos.createButton`) with existing locale keys, so the button label now actually translates instead of rendering the raw key string.

## What Was Done

One component file edited. Two lines changed. Zero locale-file changes. Zero new keys added.

### Diff (components/admin/VideoUploadForm.tsx, lines 142-144)

**Before:**
```tsx
{isSubmitting
  ? t("admin.videos.creating")
  : t("admin.videos.createButton")}
```

**After:**
```tsx
{isSubmitting
  ? t("admin.common.uploading")
  : t("admin.videos.uploadButton")}
```

### Why these specific keys

The plan instructed me to swap to `admin.videos.uploading` / `admin.videos.uploadButton`. On verification:

| Key                          | Exists in EL?      | Exists in EN?      | Notes                                            |
| ---------------------------- | ------------------ | ------------------ | ------------------------------------------------ |
| `admin.videos.uploadButton`  | Yes, line 457      | Yes, line 457      | "Δημιουργία Μαθήματος" / "Create Tutorial"       |
| `admin.videos.uploading`     | NO                 | NO                 | Plan claimed line ~428; that line is `admin.training.uploading` |
| `admin.common.uploading`     | Yes, line 344      | Yes, line 344      | "Μεταφόρτωση..." / "Uploading..." — EXACT match for plan-specified text |

The plan's `<interfaces>` block specified the EL/EN strings as `"Μεταφόρτωση..."` / `"Uploading..."`. Of every existing `*.uploading` key in the locale files, **only** `admin.common.uploading` has those exact values. The other forms' scoped keys (`admin.exercises.uploading`, `admin.training.uploading`, `admin.books.uploading`) all use `"Ανέβασμα..."` in Greek, not `"Μεταφόρτωση..."` — so they would not render the text the plan promised.

Following the plan's intent (reuse existing keys, do not invent new keys, match the stated text), `admin.common.uploading` is the unambiguous choice.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `admin.videos.uploading` does not exist; substituted `admin.common.uploading`**

- **Found during:** Pre-edit verification of plan's `<interfaces>` claim
- **Issue:** Plan's `<interfaces>` block stated `admin.videos.uploading` exists in both locale files at line ~428 with values `"Μεταφόρτωση..."` / `"Uploading..."`. Verification proved this key does not exist anywhere in either locale file. Line 428-430 area contains `admin.training.uploading`, not `admin.videos.uploading`. The plan also explicitly forbade adding new locale keys (07-01 is the sole JSON-writing plan).
- **Fix:** Used `admin.common.uploading` instead — it is the only existing locale key whose Greek/English values exactly match the plan's stated text (`"Μεταφόρτωση..."` / `"Uploading..."`), preserving the plan's user-visible behavior promise without inventing new keys or modifying locale files.
- **Files modified:** `components/admin/VideoUploadForm.tsx` (line 143 only)
- **Commit:** N/A (no-commit policy)

### Out-of-Scope Items (Not Fixed)

- Pre-existing TypeScript errors in `components/uploadExTabs/uploadBook.tsx` (6 × TS2322 "Type 'string | undefined' is not assignable to type 'string'"). Unrelated to Phase 7; logged for future cleanup.

## Verifications Run

| Check                                                                                              | Result                                                                                                          |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `grep` for new keys in `components/admin/VideoUploadForm.tsx`                                      | PASS — `admin.common.uploading` (line 143) and `admin.videos.uploadButton` (line 144) both present              |
| `grep` for old keys in `components/admin/VideoUploadForm.tsx`                                      | PASS — neither `admin.videos.createButton` nor `admin.videos.creating` remains in the file                       |
| `grep` for both new keys in `public/locales/{el,en}/common.json`                                   | PASS — `admin.common.uploading` at line 344 in both, `admin.videos.uploadButton` at line 457 in both             |
| `npm run build`                                                                                    | PASS — built in 14.49s, no errors                                                                                |
| `npm run typecheck`                                                                                | PASS for VideoUploadForm.tsx; pre-existing failures in `components/uploadExTabs/uploadBook.tsx` are out of scope |
| `git status --short` shows only `M components/admin/VideoUploadForm.tsx` for this plan's changes   | PASS                                                                                                            |

### TrainingCard.tsx confirmation (read-only spot-check)

Plan asked me to verify `components/admin/TrainingCard.tsx` lines 140 + 156 reference keys that 07-01 added:

```bash
$ grep -n "replaceContentImage\|replaceSolutionImage" components/admin/TrainingCard.tsx
140:                {t("admin.training.replaceContentImage")}
156:                {t("admin.training.replaceSolutionImage")}

$ grep -n "admin.training.replace(Content|Solution)Image" public/locales/{el,en}/common.json
public/locales/el/common.json:452:    "admin.training.replaceContentImage": "Αντικατάσταση Εικόνας Περιεχομένου",
public/locales/el/common.json:453:    "admin.training.replaceSolutionImage": "Αντικατάσταση Εικόνας Λύσης",
public/locales/en/common.json:452:    "admin.training.replaceContentImage": "Replace Content Image",
public/locales/en/common.json:453:    "admin.training.replaceSolutionImage": "Replace Solution Image",
```

Both keys present in both locales. TrainingCard renders correctly post-07-01. **No code change to TrainingCard.tsx required or made.**

### Orphan audit results

```bash
$ grep -rn "VideoUploadForm" app/ components/
app/routes/admin.videos.tsx:18: import VideoUploadForm from "components/admin/VideoUploadForm";
app/routes/admin.videos.tsx:270: <VideoUploadForm
components/admin/VideoUploadForm.tsx:8/18/22 (self-references)
```

`VideoUploadForm` has exactly one route consumer: `app/routes/admin.videos.tsx`. It is a live v1.1 admin component — **in scope**, kept.

```bash
$ grep -rn "uploadTutorial\|UploadTutorial" app/
(no matches)

$ grep -rn "uploadTutorial" components/
components/uploadExTabs/uploadTutorial.tsx:115: value="uploadTutorial"
components/uploadExTabs/uploadTutorial.tsx:116: name="_uploadTutorial"
```

`components/uploadExTabs/uploadTutorial.tsx` has **zero** consumers in `app/routes/`. (The legacy `app/routes/uploadEx.tsx` mentioned in the plan does not exist on this branch — `git status` confirms `app/routes/` does not contain `uploadEx.tsx`.) It is an orphaned v1.0 component left over from the legacy upload-tabs UI. Marked **OUT OF SCOPE for Phase 7**; no action taken. Cleanup ticketable as future work outside the i18n phase.

## Why Option B Was Chosen Over Option A

Per 07-RESEARCH Finding 1, two routes were possible:

- **Option A**: Add new `admin.videos.createButton` / `admin.videos.creating` keys to both locale files. Cost: +2 keys per file, two more dictionary entries to maintain.
- **Option B (chosen)**: Swap the component to use existing `admin.videos.uploadButton` and (after this plan's deviation) `admin.common.uploading`. Cost: 2 lines of code in one component, zero locale-file changes.

Reasons Option B wins:

1. **Convention match.** Every other admin form (`ExerciseUploadForm`, `TrainingUploadForm`, `BookUploadForm`) uses the `*.uploadButton` / `*.uploading` pattern. Following the convention keeps the videos form consistent with siblings.
2. **Smaller surface.** Two existing keys with already-correct human-readable copy ("Δημιουργία Μαθήματος" / "Create Tutorial") were sitting unused — wiring them up is cheaper than adding new keys.
3. **Locale-file hygiene.** 07-01 was deliberately the only plan that writes locale JSON; keeping that invariant simplifies cross-plan reasoning and prevents JSON-merge contention in Wave 2.
4. **Reversibility.** Future copy tweaks now happen in one place per scope (`admin.videos.uploadButton`) instead of forking copy across two parallel namespaces.

## Self-Check: PASSED

- File `components/admin/VideoUploadForm.tsx` exists at `/home/konstantina/repos/maths-joy/components/admin/VideoUploadForm.tsx` — confirmed lines 142-144 contain the new key references.
- No new files created (none expected for this plan).
- No commits made (per durable user no-commit policy).
- Locale JSON files NOT modified — `git status` shows no change to `public/locales/{el,en}/common.json` from this plan's work.
- `STATE.md` and `ROADMAP.md` NOT modified by this agent.
- `npm run build` succeeded.
