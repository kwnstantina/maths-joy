# Features Research: v1.1 Platform Completion

**Research type:** Ecosystem (features-focused)
**Confidence:** HIGH
**Date:** 2026-03-17

## Executive Summary

Q&A system is mostly built but has security gaps (no CSRF, no rate limiting). Video admin is complete but no public routes exist — students cannot see videos. Bulk upload is greenfield but builds on established patterns. i18n is well-structured with 412 synchronized keys, needs incremental additions.

## Q&A System

### Table Stakes
| Feature | Complexity | Status | Dependencies |
|---------|-----------|--------|-------------|
| Ask question with title, body, category, tags | Low | EXISTS | Auth |
| Post answer to question | Low | EXISTS | Auth |
| Upvote/downvote questions and answers | Medium | EXISTS (no CSRF) | Auth |
| Accept best answer (author only) | Low | EXISTS (no CSRF) | Auth |
| View question with answers | Low | EXISTS | None |
| Question list with pagination | Medium | PARTIAL (no pagination) | None |
| CSRF protection on all mutations | Medium | MISSING | csrf.server.ts |
| Rate limiting on Q&A actions | Low | MISSING | ratelimit.server.ts |

### Differentiators
| Feature | Complexity | Notes |
|---------|-----------|-------|
| Sort by newest/most voted/unanswered | Low | Server functions may exist, no UI |
| Edit own question/answer | Medium | Server functions exist in qa.server.ts, no UI |
| Search questions by text | Medium | Basic search exists in qa.server.ts |
| Filter by category/tags | Medium | Category filter pattern exists from book catalog |
| Math rendering in Q&A | Low | better-react-mathjax already in dependencies |
| XSS sanitization | Low | xss package already in dependencies |

### Anti-Features (Avoid)
- Real-time Q&A updates — unnecessary complexity for this scale
- Reputation/badges system — overkill for single-teacher platform
- Markdown editor — plain text + MathJax sufficient for v1.1
- Comment threads on answers — Stack Overflow complexity not needed

### Research Notes
- Q&A categories are hardcoded English strings in ask form — need i18n
- Self-voting is not prevented — users can upvote own content
- Vote count updates are non-transactional — concurrent votes cause drift
- AnswerVote records not cleaned up on question delete

## Video Management

### Table Stakes
| Feature | Complexity | Status | Dependencies |
|---------|-----------|--------|-------------|
| Admin add YouTube link with metadata | Low | EXISTS | Auth, admin role |
| Admin edit/delete video | Low | EXISTS | Auth, admin role |
| Public video listing page | Medium | MISSING | None |
| Video detail page with embed | Low | MISSING | None |
| Category filtering on public page | Medium | MISSING | Video model needs category field |

### Differentiators
| Feature | Complexity | Notes |
|---------|-----------|-------|
| Tag-based filtering | Low | Tags field exists on Video model |
| YouTube thumbnail auto-extraction | Low | Use YouTube oEmbed API or URL pattern |

### Anti-Features (Avoid)
- Video hosting on platform — YouTube handles this
- Video progress tracking — defer to v2
- Playlist management — unnecessary complexity

### Research Notes
- `admin.videos.tsx` has full CRUD with CSRF, audit logging, i18n
- `tutorial.server.ts` is separate from `video.prisma.ts` — should consolidate
- YouTube URL validation absent — `validateVideoFields` only checks non-empty
- Video tags stored as single-element array (`[tags]` instead of `tags.split(',')`) — will break filtering

## Bulk Exercise Upload

### Table Stakes
| Feature | Complexity | Status | Dependencies |
|---------|-----------|--------|-------------|
| Select multiple PDFs at once | Low | MISSING | Cloudinary streaming |
| Upload with shared category/tags | Medium | MISSING | Exercise model |
| Progress indication | Medium | MISSING | None |
| Error handling for partial failures | Medium | MISSING | None |

### Differentiators
| Feature | Complexity | Notes |
|---------|-----------|-------|
| Improved exercise search | Medium | Currently loads ALL exercises client-side |
| Server-side pagination | Medium | Needed to fix fetch-all anti-pattern |
| Tag-based exercise filtering | Low | Tags exist on model |

### Anti-Features (Avoid)
- Drag-and-drop upload zone — `<input type="file" multiple>` sufficient
- Real-time upload progress per file — defer unless batch sizes are large
- Auto-metadata extraction from PDF — unreliable

### Research Notes
- Current rate limit `upload: 5/hr` will conflict with bulk operations — needs `bulk_upload` limit or increased threshold
- Must use per-file streaming (not buffered formData) to avoid OOM on Vercel
- Streaming upload infrastructure (`uploadStreamToCloudinary`) already exists

## i18n Completion

### Table Stakes
| Feature | Complexity | Status | Dependencies |
|---------|-----------|--------|-------------|
| Q&A UI translations (el/en) | Low | MISSING | Q&A routes finalized |
| Video UI translations (el/en) | Low | MISSING | Video routes finalized |
| Exercise upload translations (el/en) | Low | MISSING | Bulk upload finalized |
| Language switch works on all new pages | Low | MISSING | All routes use handle.i18n |

### Research Notes
- 412 keys currently in each locale, fully synchronized
- No CI enforcement for key parity — new features will break without check
- Category names hardcoded as English strings in Q&A ask form — need i18n
- Do NOT translate user-generated Q&A content — only UI chrome

## Phased MVP Recommendation

1. **Q&A Core:** Harden security (CSRF, rate limiting, audit), extract components, add sort — highest user value
2. **Q&A Discovery:** Search, filter, pagination — completes Q&A experience
3. **Video Public:** Public routes, YouTube embed, category filter — unlocks content for students
4. **Exercise Improvements:** Bulk upload, search, pagination — admin productivity + student discovery
5. **i18n Completion:** Translation keys for all new features — polish pass

---
*Research completed: 2026-03-17*
