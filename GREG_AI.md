# Greg AI

Greg AI is the math tutor that lives in the orange **"Ask Greg"** button at the bottom-right of every page. It helps students step by step without handing out answers, finds exercises and videos on the site, checks practice answers, and connects students to Greg (the real teacher) when they need a person.

Students must be logged in to use it. It answers in the site's language (Greek or English).

It also stays locked until the student has accepted the current Terms and Privacy Policy and said whether they are under 15 (`/consent`). Under-15s give a parent's email; the parent gets a confirmation link (`/parent-consent/<token>`), and Greg AI unlocks when they press "I agree". Declining deletes the account. Bump `CONSENT_VERSION` in `app/utils/consent.server.ts` after a material policy change to ask everyone again. Compliance notes: `docs/legal/COMPLIANCE.md`.

---

## For students: what Greg AI can do

### 1. Help with a problem, step by step

Greg uses the Socratic method: he asks guiding questions and gives hints, but never gives the final answer straight away.

> **Student:** Πώς βρίσκω την παράγωγο της $x^2 \sin x$;
>
> **Greg:** Ωραία ερώτηση! Η συνάρτηση είναι γινόμενο δύο συναρτήσεων. Ποιον κανόνα παραγώγισης ξέρεις για τα γινόμενα;

Math is shown with proper formulas (LaTeX / MathJax).

### 2. Knows the page you're on

| Where the student is | What Greg knows |
|---|---|
| An exercise booklet (`/exercises/<id>`) | The booklet's title, level and the list of its problems. If the booklet is transcribed, Greg can read any problem by its number, and uses the official solution to aim his hints (without revealing it). |
| A "test yourself" problem (`/testYourself`) | The chapter, the problem's name, and the problem's text and official solution (transcribed once from its images, see below). Greg uses the solution to aim hints, without revealing it. |
| Any other page | Which section of the site the student is in. |

> **Student (on a booklet page):** Βοήθησέ με στην άσκηση #5
>
> **Greg:** *(reads problem #5 from the booklet)* Ας ξεκινήσουμε: τι σου ζητάει η άσκηση να βρεις;

### 3. 📷 Send a photo of a problem

The 📷 button next to the message box attaches a photo (from the camera on a phone). The student can add a question or just send it.

> **Student:** 📷 *(photo of a problem from their school book)*
>
> **Greg:** Βλέπω την άσκηση: *Να βρεθεί η παράγωγος της $f(x)=x^2\ln x$.* Τι κανόνα θα χρησιμοποιήσεις για γινόμενο;

- The photo is shrunk in the browser (max 1280px), so one photo costs about as much as a long message (~1–2k tokens).
- The photo is **not stored**: it's sent once with that message. Greg starts his reply by writing out the problem, so later messages still know what it says.

### 4. Hint buttons

After Greg's first reply, buttons appear above the message box:

1. **💡 Hint**: one small nudge
2. **💡 Another hint**: a bigger step
3. **✅ Show solution**: the full step-by-step solution (only appears after at least one hint)

The button sends its own text as the message (e.g. "💡 Δώσε μου ένα μικρό hint"), so it costs the same as typing.

### 5. Finds exercises and videos on the site

> **Student:** Θέλω ασκήσεις για ολοκληρώματα
>
> **Greg:** Βρήκα αυτές: άσκηση 3 στο [Ολοκληρώματα – Γ' Λυκείου](/exercises/…) … και ένα βίντεο: [Ορισμένο ολοκλήρωμα](/videos?video=…)

Greg only links to content that really exists. Video links open the videos page scrolled to that video, with a highlight.

### 6. 🎯 Practice mode

Open it from the 🎯 button in the widget header or the **🎯 Practice mode** starter button.

1. Type a topic (e.g. `παράγωγος`), or leave it empty for a random problem.
2. A real problem from the library appears.
3. Write your answer and press **Check my answer**.
4. Greg compares it with the official solution and answers **✅ Correct**, **🟡 Almost there** or **❌ Not yet**, with a short hint. He never reveals the solution.
5. **Try again**, **Next problem**, or **Ask Greg**. "Ask Greg" opens the problem's booklet and fills in "Help me with problem #N" in the chat.

Every checked answer is saved to the student's `/progress` page as a score (100 / 50 / 0).

> Practice mode only uses problems that have a transcribed official solution (`ExerciseItem.solution`). To add more, transcribe booklets with `prisma/transcribe-exercises.ts`.

### 7. Talk to Greg, the teacher

Students can reach the real Greg in three ways:

- the **📞 button** in the widget header
- the **"Talk to Greg (the teacher)"** or **"Private lessons"** starter buttons
- Greg AI offers it himself when a student asks for a person, is stuck after several hints, asks about private lessons, or has a problem with the site

> **Student:** Θέλω να κάνω ιδιαίτερα
>
> **Greg:** Ο Greg κάνει ιδιαίτερα μαθήματα! Δες παρακάτω πώς να επικοινωνήσεις μαζί του.
> *(a contact card appears)*

The **contact card** has these buttons:

| Button | What it does |
|---|---|
| ✉️ **Send this conversation to Greg** | Emails the conversation (plus an optional note, e.g. "test on Friday") to Greg. The email's Reply-To is the student's email, so Greg can answer directly from his inbox. |
| 📅 **Book a lesson** | Opens the booking calendar. Only shown when `BOOKING_URL` is set. |
| 📞 **Call** | `tel:` link |
| 💬 **WhatsApp** | Opens a WhatsApp chat |

Nothing is emailed unless the **student clicks** "Send". The AI can only show the card.

### 8. Personal touch

- The first time, the welcome screen asks **"What grade are you in?"** (Α' Γυμνασίου … Γ' Λυκείου, University). Greg then explains things at that level.
- Greg knows the student's first name and the topics where they recently needed big hints or solutions (last 30 days).

### 9. More

- **Starter buttons** on the welcome screen: help with a problem here, explain a concept, practice exercises, practice mode, talk to Greg, private lessons
- **Conversation history** (🕘): reopen or delete past chats
- **👍 / 👎** on every answer. These feed the teacher dashboard.
- **Daily limit**: 50 messages and a cost budget per student per day; it resets at midnight UTC.

---

## For Greg (admin): teacher dashboard

**Admin panel → Greg AI** (`/admin/greg-ai`), for the last 7, 30 or 90 days:

- **Active students**, **messages**, **AI cost** (total and per message)
- **Rated helpful**: share of 👍 out of all ratings
- **Hint usage**: hints, bigger hints, solutions shown
- **Practice answers checked** and the average score
- **Where students ask for help**: booklets and practice problems ranked by number of questions, with counts of big hints and solutions. Many big hints or solutions on a topic means students find it hard, which makes it a good candidate for a new video or an easier warm-up exercise.
- **Recent 👎 answers**: Greg AI replies that students marked unhelpful, useful for spotting mistakes

The dashboard only reads data that's already saved (no AI cost). The data starts from when this feature was deployed.

> ⚠️ Students are minors. Before going live, make sure the privacy policy says that chats may be reviewed by the teacher.

---

## Setup

### Environment variables

```env
# Required
ANTHROPIC_API_KEY="sk-ant-..."          # Greg AI's model
RESEND_API_KEY="re_..."                 # contact form + "send conversation to Greg" emails

# Optional
GREG_AI_ENABLED="true"                  # set to false to hide Greg AI everywhere
CONTACT_EMAIL_TO="gregkirmaths@gmail.com"     # where emails are delivered
CONTACT_EMAIL_FROM="Greg AI <noreply@your-domain>"  # must be a domain verified in Resend
CONTACT_PUBLIC_EMAIL="gregkirmaths@gmail.com" # shown on the contact page
CONTACT_PHONE="+306987495775"           # Call buttons
CONTACT_WHATSAPP="+306987495775"        # defaults to CONTACT_PHONE; "off" hides WhatsApp
BOOKING_URL="https://cal.com/..."       # enables "Book a lesson" (https only)
```

> `CONTACT_EMAIL_FROM` defaults to Resend's test sender (`onboarding@resend.dev`), which only delivers to the Resend account owner's address. Verify your domain in Resend for real use.

### Transcribing exercises and "test yourself" problems

Greg reads **text**, not PDFs or images, on every chat message. Each exercise booklet (PDF) and each "test yourself" problem (problem image + solution image) is transcribed **once** into text and stored:

- booklets → `ExerciseItem` rows; "test yourself" → `Training.gregStatement` / `gregSolution`
- runs automatically in the background when the admin uploads or replaces a file
- if it didn't finish (e.g. the serverless function stopped), the first chat on that problem starts it again
- **Every Vercel production deploy** runs it as the last step of `npm run build` (`greg:transcribe:deploy`): only missing or out-of-date items, at most 15 minutes per deploy (the rest is done on the next deploy), and a failure never fails the deploy. Preview deploys skip it.
- `npm run greg:transcribe` does the same by hand, using `.env` (`-- --force` redoes all, `-- <id>` one item).

Cost: one-off, a few cents per booklet or problem (~$0.03 per "test yourself" problem with `claude-opus-5-5`).

### Database

Greg AI uses these Prisma models: `GregChatSession`, `GregChatMessage`, `GregDailyUsage`, `ExerciseItem`, `UserProgress`, plus `User.grade` and the `Training.greg*` fields. After changing `prisma/schema.prisma`, run `npm run prisma:generate` (stop dev servers first on Windows). The Vercel build runs it automatically.

---

## Cost: how Greg AI keeps tokens low

| Action | AI tokens |
|---|---|
| Opening the widget, starter buttons, contact card, call / WhatsApp / booking, sending the conversation email | **0** |
| Getting a practice problem | **0** (database lookup) |
| Teacher dashboard | **0** |
| Hint buttons | Same as a typed message |
| Chat message | 1 call (+1 if Greg searches the library or opens a problem; max 3 rounds) |
| Photo | ~1–2k extra input tokens, on that one message only |
| Transcribing a booklet / "test yourself" problem | One-off, at upload (not per chat) |
| Checking a practice answer | 1 short call |

Design rules for adding new Greg AI features:

- Prefer **plain buttons** that don't call the model.
- Prefer **reply markers** (Greg writes `[[contact:help]]` and the widget turns it into UI) over new tools. A tool adds its description to every request and often an extra model call.
- Add new results to an **existing tool** where possible (videos ride along with `search_exercises`).
- Keep system-prompt additions to a line or two.

Model: `claude-haiku-4-5`. Limits: `CHAT_DAILY_LIMIT` (50 messages) and `CHAT_DAILY_SPEND_BUDGET` (~$0.30/student/day), both in `app/utils/anthropic.server.ts`.

---

## Where the code lives

| Part | File |
|---|---|
| Widget UI (chat, photos, hints, starters, contact card, grade picker) | `components/gregAi/gregAiWidget.tsx` |
| Practice mode UI | `components/gregAi/practicePanel.tsx` |
| Message rendering (bold, safe same-site links) | `components/gregAi/messageContent.tsx` |
| System prompt, tools, limits, cost | `app/utils/anthropic.server.ts` |
| Chat endpoint (streaming, tool loop, photos) | `app/routes/api.greg-ai.tsx` |
| Transcribe booklets / "test yourself" problems | `app/utils/exerciseTranscript.server.ts`, `app/utils/trainingTranscript.server.ts`, `prisma/transcribe-exercises.ts` |
| Practice: get a problem / check an answer | `app/routes/api.greg-ai.practice.tsx` |
| Send conversation to Greg | `app/routes/api.greg-ai.handoff.tsx` |
| Save grade | `app/routes/api.greg-ai.profile.tsx` |
| History, ratings | `app/routes/api.greg-ai.sessions.tsx`, `api.greg-ai.feedback.tsx` |
| Chat data, quotas, recent struggles | `app/utils/gregChat.prisma.ts` |
| Teacher dashboard | `app/routes/admin.greg-ai.tsx`, `app/utils/gregAnalytics.server.ts` |
| Contact details | `app/utils/contactInfo.server.ts` |
| Emails | `app/utils/email.server.ts` |
| Grades | `app/utils/grades.ts` |
| Texts (Greek / English) | `public/locales/{el,en}/common.json` → `gregAi.*` |
