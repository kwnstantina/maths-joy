# GregKyrMaths — Compliance file

Internal record for the controller (Grigoris Kyritsis). Not published on the site.
Prepared 2026-10-25 with an AI assistant. **Not legal advice** — have a Greek data-protection
lawyer review the items marked ⚖️ before relying on it.

Keep this file up to date when processing changes, and keep a dated copy (PDF) — the Hellenic DPA
(ΑΠΔΠΧ, www.dpa.gr) can ask to see it.

---

## 1. Records of processing activities (GDPR art. 30)

| # | Activity | Data subjects | Data | Purpose | Legal basis | Processors | Retention |
|---|---|---|---|---|---|---|---|
| 1 | Accounts & login | Students, parents (email only) | Name, email, bcrypt password hash, Google profile, grade | Run the account | Art. 6(1)(b) contract | MongoDB Atlas, Vercel, Google (OAuth) | Life of account; deleted on request via `/account` |
| 2 | Consent records | Students, parents | Age band (under/over 15), terms version + date, parent email, parent confirmation date | Prove consent (art. 7(1), 8) | Art. 6(1)(c) / 7(1) | MongoDB Atlas, Resend | Life of account |
| 3 | Greg AI tutoring | Students (incl. 12–18) | Chat messages, photos (not stored), grade, first name, recent struggles, practice scores, ratings, daily usage | Tutoring | Art. 6(1)(b); under 15: parent consent (art. 8) | Anthropic, MongoDB Atlas, Vercel | Until the student deletes the chat or account; Anthropic ≤30 days (≤2 y if flagged) |
| 4 | Teacher review of chats | Students | Chats, ratings, aggregate dashboard | Improve material, spot AI errors, safety | Art. 6(1)(f) legitimate interest ⚖️ | MongoDB Atlas | As #3 |
| 5 | "Send conversation to Greg" | Students | Name, email, chat transcript, note | Human help on request | Art. 6(1)(b) | Resend | Teacher's mailbox — delete when resolved |
| 6 | Book sales | Buyers | Purchase, amount, Stripe IDs, withdrawal-waiver timestamp | Sale, tax | Art. 6(1)(b), (c) | Stripe, Cloudinary | 5 years (tax) |
| 7 | Q&A community | Users | Posts, votes, display name | Community | Art. 6(1)(b) | MongoDB Atlas | Anonymised on account deletion |
| 8 | Community live chat | Users | Name, email, messages | Chat | Art. 6(1)(b) | Supabase | Deleted on account deletion |
| 9 | Contact form | Anyone | Name, email, message | Reply | Art. 6(1)(f) | Resend | 24 months |
| 10 | Newsletter | Subscribers | Email | Marketing | Art. 6(1)(a) consent | Kit (ConvertKit) | Until unsubscribe |
| 11 | Security & audit | Users | IP, user agent, sensitive actions | Security | Art. 6(1)(f) | MongoDB Atlas, Vercel | 12 months |
| 12 | Web analytics | Visitors | Cookie-less, anonymised page views | Statistics | Art. 6(1)(f) | Vercel | Vercel default |

## 2. Data protection impact assessment (GDPR art. 35) — summary ⚖️

**Why a DPIA:** the Hellenic DPA's list of processing that requires a DPIA (Decision 65/2018)
covers systematic processing of vulnerable people's data (minors) and innovative technology (AI).
Greg AI does both. A DPIA is required **before** the processing; record it now and have it reviewed.

**Description:** Greg AI is a Socratic math tutor built on Anthropic's Claude models (API, no
training on our data). It stores conversations in MongoDB, personalises answers with grade, first name
and recent struggles, and gives the teacher an aggregate dashboard plus access to chats.

**Necessity & proportionality**
- Only the data needed for tutoring is sent to the model; photos are resized in the browser and never stored.
- No advertising, no profiling for anything other than tutoring, no automated decisions with legal effect.
- Daily usage cap; minors under 15 need verified parent consent (email link) before Greg AI works.
- Students can delete chats (history 🕘) or the whole account and export everything (`/account`).

**Risks and mitigations**

| Risk | Likelihood / impact | Mitigation | Residual |
|---|---|---|---|
| Child shares sensitive personal data in chat | Medium / Medium | In-chat notice "don't share personal details"; system prompt keeps to math; deletion available | Low–Medium |
| Child under 15 lies about age | Medium / Medium | Self-declaration + parent email confirmation is the "reasonable effort" of art. 8(2); age stated in Terms | Medium ⚖️ |
| AI gives wrong/unsafe answers | Medium / Low | Notice that it's an AI and can be wrong; 👎 feedback reviewed by teacher; solution-aimed hints | Low |
| Student mistakes Greg AI for the teacher | Low / Medium | Named "Greg AI", subtitle and first message say it's an AI, not the teacher (AI Act art. 50) | Low |
| Teacher review felt intrusive | Medium / Low | Disclosed in policy, consent screen, parent email, chat notice | Low ⚖️ |
| Transfer to US processors | Certain / Medium | Processors under SCCs / EU-US Data Privacy Framework; DPAs accepted (see §3) | Low |
| Data breach | Low / High | TLS, bcrypt, CSRF, rate limits, audit log, least data | Low |

**Outcome:** acceptable with the mitigations above. Review yearly or when Greg AI changes (e.g. new
model, new data, memory features).

## 3. Processor agreements (GDPR art. 28) — check each is accepted

Most include the DPA in their terms automatically; some need it accepted in account settings.
Search "<provider> DPA" and save a PDF of each.

| Processor | Note | Done |
|---|---|---|
| Anthropic | DPA is part of the Commercial Terms | [ ] |
| Vercel | | [ ] |
| MongoDB Atlas | | [ ] |
| Stripe | Part of the Stripe Services Agreement | [ ] |
| Cloudinary | | [ ] |
| Resend | | [ ] |
| Supabase | Accept in organization settings | [ ] |
| Kit (ConvertKit) | Also enable **double opt-in** on the form | [ ] |
| Google (OAuth) | Google Cloud data processing terms | [ ] |

## 4. Still to do (owner: Greg)

- [ ] Fill legal details in `app/utils/legalEntity.ts`: exact legal name, business address, ΑΦΜ, ΔΟΥ, ΓΕΜΗ (if any), court city
- [ ] Accept every DPA in §3; enable double opt-in in Kit
- [ ] Turn on Stripe **receipt emails** (Settings → Customer emails → Successful payments): the receipt carries the withdrawal-waiver confirmation
- [ ] Decide what happens to old accounts: they are asked to accept the new terms the next time they open Greg AI
- [ ] Book a one-off lawyer review of the ⚖️ items below

## 5. Questions for the lawyer ⚖️

1. Is self-declared age + parent-email confirmation enough "reasonable effort" (GDPR art. 8(2)) for 12–14 year olds, or does the ΑΠΔΠΧ expect more?
2. Contract capacity: minors 15–17 accept the Terms themselves — is that valid under the Greek Civil Code for a free service, and for paid books?
3. Teacher reading minors' chats on legitimate interest — is the balancing test OK, or should it be consent-based / opt-out?
4. EU AI Act: does Greg AI (practice-answer scoring saved to `/progress`) fall under Annex III point 3 (education, "evaluating learning outcomes")? If so, high-risk obligations apply from **2 December 2027** (Digital Omnibus). Art. 50 transparency already applies and is implemented.
5. Review this DPIA and sign off.
6. Confirm the digital-content withdrawal-waiver wording and checkbox satisfy N. 2251/1994.
7. Is a DPO needed? (Likely not — small scale — but confirm given minors + AI.)
