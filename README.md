# LessGo

### A placement-preparation workspace

LessGo brings interview practice, DSA tracking, job-application organization, and AI-assisted coaching into one full-stack application. It is designed for students preparing for technical and early-career software roles.

## Product features

- **Interview preparation:** browse company-tagged technical, aptitude, HR, and computer-science questions.
- **DSA practice:** track problem status, add revision notes, reveal progressive hints, review plain-English approaches and complexity, and step through algorithm visualizations.
- **Learning resources:** follow guided Frontend, Backend, Full Stack, DSA, and AI/ML roadmaps; browse and bookmark curated resources.
- **Application tracking:** organize applications across stages with a Kanban board and a mobile-friendly stage selector.
- **OA simulator:** take timed, track-aware mock assessments with auto-graded aptitude questions and a section-by-section result.
- **Progress dashboard:** review DSA topic coverage, activity streaks, application progress, and a track-weighted Placement Readiness Score with its component breakdown and next-step suggestions.
- **Personalized study plan:** generate a seven-day plan from tracked DSA and roadmap progress, recent AI interview scores, and the selected target track. Choose a daily study-time budget; the plan reports when available history is limited.
- **Voice mock interview:** use browser speech recognition and text-to-speech for Classic Practice or run a conversational AI interview across Technical, HR, and System Design rounds. Classic Practice can request AI scores for structure, clarity, and relevance, with strengths and improvement tips. AI Bot sessions support dynamic follow-ups and an end-of-session report.
- **Resume Analyzer:** paste resume text or upload a PDF/DOCX (up to 5 MB) for ATS-style feedback. Compare the resume with a job description to review an estimated match, evidence-backed skill matches and gaps, and suggested edits grounded in the resume. Build STAR answers from project notes; saved answers can inform the AI Bot's HR round. Uploaded files are parsed in memory and are not retained.
- **Account and interface:** register and sign in, set a target hiring track that adjusts DSA ordering, OA content, AI interview context, and readiness-score weights, use a personal dashboard, and switch between light and dark themes. The interface is responsive across desktop and mobile.

AI-powered interviews, AI voice feedback, study plans, resume analysis, and resume-to-job comparisons require a Google Gemini API key. Browser-based speech features require a supported browser and microphone permission.

---

## 🏗️ Tech Stack

| Layer      | Technology                                  |
|------------|----------------------------------------------|
| Frontend   | Next.js 14 (App Router), React 18, Tailwind CSS |
| Backend    | Node.js, Express                              |
| Database   | PostgreSQL + Prisma ORM                       |
| Auth       | JWT + bcrypt                                  |
| AI         | Google Gemini API                             |
| Resume files | PDF/DOCX text extraction (in-memory)         |
| Icons      | lucide-react                                  |

---

## 📁 Project Structure

```
lessgo/
├── backend/                 # Express API
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.js          # Sample data seeder
│   ├── src/
│   │   ├── middleware/auth.js
│   │   ├── routes/          # auth, interview, leetcode, roadmaps, resources, dashboard
│   │   ├── utils/prisma.js
│   │   └── index.js         # App entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/                 # Next.js app
│   ├── app/
│   │   ├── components/      # Navbar, Footer, ThemeToggle, Providers
│   │   ├── context/          # AuthContext
│   │   ├── lib/api.js        # Axios client
│   │   ├── login/ register/ dashboard/
│   │   ├── interview-prep/ dsa/ roadmaps/ resources/ applications/ mock-interview/ progress/
│   │   ├── layout.jsx
│   │   └── page.jsx          # Landing page
│   ├── .env.local.example
│   └── package.json
│
├── docker-compose.yml        # Local PostgreSQL for development
└── README.md
```

---

## ⚡ Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL (local install, Docker, or a hosted DB like Supabase/Neon/Railway)

### 2. Clone & Install

```bash
cd lessgo

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Set up the database

**Option A — Docker (easiest):**

```bash
docker compose up -d
```

**Option B — Local PostgreSQL:** create a database named `lessgo`.

### 4. Configure environment variables

```bash
# backend
cd backend
cp .env.example .env
# Edit .env and set DATABASE_URL, JWT_SECRET, CLIENT_URL

# frontend
cd ../frontend
cp .env.local.example .env.local
# Edit .env.local if your API runs on a different port
```

If you used the Docker Compose file, your `DATABASE_URL` is:

```
postgresql://lessgo:lessgo@localhost:5432/lessgo?schema=public
```

> **AI features:** set `GEMINI_API_KEY` in `backend/.env` to enable AI interview rounds and reports, Classic Practice AI feedback, personalized study plans, resume analysis, resume-to-job comparison, and STAR answer generation. A missing or invalid key produces an AI service error; non-AI features continue to work. Get a key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 5. Run migrations & seed sample data

```bash
cd backend
npx prisma migrate dev --name init
npm run seed
```

This creates a demo account (with target track pre-set to `FAANG` so track-aware features are demoable immediately):
- **Email:** `demo@lessgo.dev`
- **Password:** `password123`

### 6. Start the app

In two terminals:

```bash
# Terminal 1 — backend (http://localhost:5000)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:3000)
cd frontend
npm run dev
```

Visit **http://localhost:3000** 🎉

---

## 🔑 Environment Variables

### backend/.env
| Variable       | Description                              |
|----------------|--------------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string               |
| `PORT`         | Port the API runs on (default `5000`)      |
| `JWT_SECRET`   | Secret used to sign JWT tokens             |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`)                 |
| `CLIENT_URL`   | Frontend URL, used for CORS                |
| `GEMINI_API_KEY` | Google Gemini API key for AI-powered features |
| `GEMINI_MODEL` | Optional model override (defaults to `gemini-2.5-flash`) |

### frontend/.env.local
| Variable              | Description               |
|-----------------------|----------------------------|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API |

---

## 🧩 API Overview

All routes are prefixed with `/api`.

> Note: the **DSA** page in the UI is powered by the `/api/leetcode/*` routes, and the **Progress** page is powered by the `/api/analytics/*` routes — the backend route names were kept stable while the frontend navigation and page names were simplified.

| Method | Route                                 | Description                       | Auth |
|--------|----------------------------------------|------------------------------------|------|
| POST   | `/auth/register`                       | Create a new account               | ❌   |
| POST   | `/auth/login`                          | Log in                             | ❌   |
| GET    | `/auth/me`                             | Get current user                   | ✅   |
| GET    | `/interview/companies`                 | List companies                     | ❌   |
| GET    | `/interview/questions`                 | List/filter interview questions    | ❌   |
| GET    | `/leetcode/problems`                   | List DSA problems + your progress (includes hints, approach, complexity, visualization steps) | ✅ |
| PUT    | `/leetcode/problems/:id/status`        | Update solve status                | ✅   |
| GET    | `/leetcode/progress-summary`           | Solved/attempted/remaining counts  | ✅   |
| POST   | `/leetcode/problems/:id/notes`         | Add a note                         | ✅   |
| GET    | `/leetcode/problems/:id/notes`         | List your notes for a problem      | ✅   |
| GET    | `/roadmaps`                            | List all roadmaps                  | ❌   |
| GET    | `/roadmaps/:id`                        | Roadmap detail with steps          | ❌ (progress needs ✅) |
| PUT    | `/roadmaps/steps/:stepId/toggle`       | Mark step complete/incomplete      | ✅   |
| GET    | `/resources`                           | List/filter free resources         | ❌   |
| POST   | `/resources/:id/bookmark`              | Toggle bookmark                    | ✅   |
| GET    | `/resources/bookmarks/mine`            | List your bookmarks                | ✅   |
| GET    | `/dashboard`                           | Aggregate stats for logged-in user | ✅   |
| GET    | `/applications`                        | List your application tracker cards | ✅  |
| POST   | `/applications`                        | Add a new application               | ✅  |
| PUT    | `/applications/:id`                    | Update stage/notes/role/company     | ✅  |
| DELETE | `/applications/:id`                    | Remove an application                | ✅  |
| GET    | `/leetcode/companies`                  | Distinct company tags for filtering  | ✅  |
| GET    | `/analytics/topics`                    | Topic-wise solved/total breakdown    | ✅  |
| GET    | `/analytics/streak`                    | Current/longest streak + 30-day map  | ✅  |
| GET    | `/analytics/readiness`                 | Placement Readiness Score + suggestions (track-weighted if a track is set) | ✅ |
| POST   | `/analytics/study-plan`                | Generate a personalized seven-day study plan from tracker and interview data | ✅ |
| PUT    | `/auth/track`                          | Set/change the user's target track   | ✅  |
| GET    | `/oa-simulator/config`                 | OA format (duration/sections) for a track | ✅ |
| POST   | `/oa-simulator/start`                  | Start a timed OA attempt, get a track-curated question set | ✅ |
| POST   | `/oa-simulator/submit`                 | Submit answers, get scored report    | ✅  |
| GET    | `/oa-simulator/history`                | Past OA attempts                     | ✅  |
| POST   | `/interview-bot/start`                 | Start an AI-driven interview round (requires `GEMINI_API_KEY`) | ✅ |
| POST   | `/interview-bot/:id/respond`           | Submit an answer, get a dynamic LLM follow-up | ✅ |
| POST   | `/interview-bot/:id/finish`            | Get scored AI feedback (clarity/accuracy/pacing) | ✅ |
| POST   | `/interview-bot/voice-feedback`        | Score one Classic Practice answer for structure, clarity, and relevance; stores feedback summary, not answer text | ✅ |
| POST   | `/resume/upload`                       | Extract text from a PDF or DOCX resume in memory (5 MB limit) | ✅ |
| POST   | `/resume/analyze`                      | ATS-style resume analysis (requires `GEMINI_API_KEY`) | ✅ |
| POST   | `/resume/compare`                      | Compare resume evidence with a job description (requires `GEMINI_API_KEY`) | ✅ |
| POST   | `/resume/star`                         | Generate + save a STAR-format answer | ✅  |
| GET    | `/resume/star`                         | List saved STAR answers              | ✅  |
| DELETE | `/resume/star/:id`                     | Delete a saved STAR answer           | ✅  |

---

## 🎨 Features Included

- ✅ JWT-based authentication (register/login/logout)
- ✅ Dark/light mode with system preference detection (`next-themes`)
- ✅ Fully responsive design (mobile, tablet, desktop)
- ✅ Company-wise interview question bank with category & search filters
- ✅ DSA problem tracker with status updates, difficulty/topic/company filters, and personal notes
- ✅ **Progressive hints** on every DSA problem (revealed one at a time, so you're never fully spoiled)
- ✅ Plain-English **approach walkthroughs** and time/space **complexity badges** on every DSA problem
- ✅ **Animated step-by-step algorithm visualizer** (play/pause/step controls) on a representative set of problems spanning arrays, strings, stacks, linked lists, trees, graphs, and DP
- ✅ Learning roadmaps with per-step progress checklists
- ✅ Curated free resources with bookmarking
- ✅ Personal dashboard with progress summaries
- ✅ Kanban-style application tracker with drag-and-drop (and a mobile-friendly dropdown fallback)
- ✅ Daily streak tracking with a 30-day activity calendar
- ✅ **Progress page** merging your Placement Readiness Score, streak calendar, and topic-wise progress rings into one view
- ✅ Company-wise tagging on DSA problems, with a company filter
- ✅ Voice-based mock interview assistant with a selectable browser voice, live speech recognition, and immediate Classic Practice feedback; speech features use the browser Web Speech API, while optional LLM scoring uses Gemini
- ✅ Optional AI coaching for Classic Practice answers: structure, clarity, relevance, strengths, and actionable improvements
- ✅ AI Interview Bot with dynamic follow-up questions and end-of-session scoring for clarity, technical accuracy, and pacing
- ✅ Personalized, on-demand seven-day study plan based on DSA topic progress, roadmap completion, target track, and available AI interview scores
- ✅ Resume Analyzer accepts pasted text or PDF/DOCX uploads (5 MB maximum); extracted files are handled in memory and not stored
- ✅ Resume-to-job-description comparison with estimated match score, evidence-backed skill matches and gaps, prioritized recommendations, and reviewable summary/bullet suggestions
- ✅ STAR answer generation and saved stories that can be referenced in the AI Bot's HR round
- ✅ **Placement Readiness Score** — a single 0-100 score blending DSA practice, roadmap progress, streak consistency, application pipeline, and engagement, with a breakdown and personalized next-step suggestions
- ✅ Modern, reactive UI: fade-up scroll reveals, mouse-tilt "reactive" cards, animated stat counters, skeleton loading states, and a tightened navbar with a "More" dropdown for secondary pages — while keeping the original clean blue color palette
- ✅ Seed script with real, well-researched sample data: **150 DSA problems** (with hints, approach, and complexity for every one — drawn from genuinely well-known, commonly-asked interview problems), **~110 interview questions** across Technical/Aptitude/HR/CS Subject (grounded in researched real-world question patterns from TCS NQT, Amazon SDE rounds, and common CS fundamentals), 30+ curated resources, 12 companies, 5 roadmaps

> **Note on the Voice Mock Interview:** it relies on the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API), which is best supported in Chrome and Edge on desktop. Firefox and Safari have limited or no support for live speech recognition. Available voices depend on your OS — the assistant automatically picks the most natural-sounding English voice it can find, and you can switch voices from the dropdown on the page.

---

## 🚢 Deployment Notes

- **Frontend:** Deploy easily to Vercel. Set `NEXT_PUBLIC_API_URL` to your deployed backend URL.
- **Backend:** Deploy to Render, Railway, or Fly.io. Set all env vars from `.env.example`.
- **Database:** Use a managed PostgreSQL provider like Neon, Supabase, or Railway.
- Run `npx prisma migrate deploy` on the backend during deployment instead of `migrate dev`.

---

## 📝 License

This project is provided as a learning template — free to use and modify for personal or educational projects.
