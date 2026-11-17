# 🚀 LessGo — Student Placement Prep Platform

LessGo is a clean, minimal, beginner-friendly full-stack web app that brings together
everything a student needs to prepare for placements:

- 📋 **Interview Preparation** — company-wise questions, aptitude, HR, and CS subjects
- 🧠 **DSA Practice** — problem tracker with progressive hints, plain-English approach walkthroughs, time/space complexity, and animated step-by-step algorithm visualizations
- 🗺️ **Learning Roadmaps** — guided step-by-step paths (Frontend, Backend, Full Stack, DSA, AI/ML)
- 📚 **Free Resources** — curated YouTube videos, docs, cheat sheets, and PDFs
- 🗂️ **Application Tracker** — a Kanban board (Applied → OA → Interview → Offer/Reject)
- 🎙️ **Voice Mock Interview** — a Siri-style assistant that speaks questions in a recruiter-like voice, listens to your spoken answer, and talks back with feedback — no external API needed
- 📊 **Progress** — one page combining your Placement Readiness Score, daily streak, and topic-wise breakdown
- 🔐 Authentication, a personal dashboard, and dark/light mode — fully responsive, with a modern, reactive UI (scroll animations, tilt cards, skeleton loading states).
- 🎯 **Track System** — set a target track (FAANG / Product-Startup / Service-Fresher) in Settings; it reorders DSA questions by relevance, reweights your Readiness Score, and tailors the OA Simulator and AI Interview Bot content
- ⏱️ **OA Simulator** — a timed mock test matching your track's typical OA format (auto-graded aptitude MCQs + self-reported coding), with a scored section-wise report
- 🤖 **AI Interview Bot** — an LLM-powered mode inside Mock Interview with Technical/HR/System Design rounds, dynamic follow-up questions based on your actual answers, and a scored AI report (clarity, technical accuracy, pacing). Requires a free Google Gemini API key.
- 📄 **Resume Analyzer & STAR Builder** — paste your resume for an ATS-style score, missing-keyword/metric/link flags, and a guided Situation-Task-Action-Result builder for each detected project — saved answers are referenced by the AI Interview Bot's HR round. Requires a free Google Gemini API key.

---

## 🏗️ Tech Stack

| Layer      | Technology                                  |
|------------|----------------------------------------------|
| Frontend   | Next.js 14 (App Router), React 18, Tailwind CSS |
| Backend    | Node.js, Express                              |
| Database   | PostgreSQL + Prisma ORM                       |
| Auth       | JWT + bcrypt                                  |
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

> **Optional but recommended:** set `GEMINI_API_KEY` in `backend/.env` to enable the **AI Interview Bot** and **Resume Analyzer/STAR Builder**. Gemini has a generous free tier — get a key in about a minute at https://aistudio.google.com/app/apikey. Everything else in the app works fully without it — those two specific features will return a clear "AI service not configured" message until a key is added.

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
| PUT    | `/auth/track`                          | Set/change the user's target track   | ✅  |
| GET    | `/oa-simulator/config`                 | OA format (duration/sections) for a track | ✅ |
| POST   | `/oa-simulator/start`                  | Start a timed OA attempt, get a track-curated question set | ✅ |
| POST   | `/oa-simulator/submit`                 | Submit answers, get scored report    | ✅  |
| GET    | `/oa-simulator/history`                | Past OA attempts                     | ✅  |
| POST   | `/interview-bot/start`                 | Start an AI-driven interview round (requires `GEMINI_API_KEY`) | ✅ |
| POST   | `/interview-bot/:id/respond`           | Submit an answer, get a dynamic LLM follow-up | ✅ |
| POST   | `/interview-bot/:id/finish`            | Get scored AI feedback (clarity/accuracy/pacing) | ✅ |
| POST   | `/resume/analyze`                      | ATS-style resume analysis (requires `GEMINI_API_KEY`) | ✅ |
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
- ✅ Voice-based mock interview assistant with a Siri-style animated orb — the assistant speaks questions aloud in a selectable voice, listens to your spoken answer, and talks back with feedback (uses the browser's built-in Web Speech API — works in Chrome/Edge on desktop, no external API key required)
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
