import Link from "next/link";
import {
  Briefcase, Code2, Map, BookOpen, ArrowRight, Kanban, Mic, Gauge, Sparkles,
} from "lucide-react";
import ScrollReveal from "./components/ScrollReveal";
import ReactiveCard from "./components/ReactiveCard";
import AnimatedCounter from "./components/AnimatedCounter";

const features = [
  {
    icon: Briefcase,
    title: "Interview Preparation",
    desc: "Company-wise technical questions, aptitude, HR rounds, and core CS subjects — all in one place.",
    href: "/interview-prep",
  },
  {
    icon: Code2,
    title: "DSA Practice",
    desc: "Solve, get progressive hints when stuck, and watch algorithms play out step by step.",
    href: "/dsa",
    highlight: true,
  },
  {
    icon: Map,
    title: "Learning Roadmaps",
    desc: "Step-by-step guided paths for Frontend, Backend, Full Stack, DSA, and AI/ML.",
    href: "/roadmaps",
  },
  {
    icon: BookOpen,
    title: "Free Resources",
    desc: "Curated YouTube videos, docs, cheat sheets, and PDFs handpicked for students.",
    href: "/resources",
  },
  {
    icon: Kanban,
    title: "Application Tracker",
    desc: "A Kanban board to track every company you've applied to, from OA to offer.",
    href: "/applications",
  },
  {
    icon: Mic,
    title: "Voice Mock Interview",
    desc: "Talk to a recruiter-style voice assistant that listens and responds — practice out loud.",
    href: "/mock-interview",
  },
  {
    icon: Gauge,
    title: "Your Progress",
    desc: "One readiness score blending DSA, roadmaps, streaks, and applications — plus daily consistency tracking.",
    href: "/progress",
  },
];

const stats = [
  { value: 150, suffix: "+", label: "DSA problems" },
  { value: 100, suffix: "+", label: "Interview questions" },
  { value: 30, suffix: "+", label: "Free resources" },
  { value: 5, suffix: "", label: "Guided roadmaps" },
];

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full bg-brand-400/20 blur-3xl" />
        <div className="pointer-events-none absolute top-32 left-10 h-64 w-64 rounded-full bg-purple-400/10 blur-3xl hidden sm:block" />
        <div className="pointer-events-none absolute top-10 right-10 h-64 w-64 rounded-full bg-brand-300/10 blur-3xl hidden sm:block" />

        <div className="relative">
          <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 mb-4">
            🚀 Built for students preparing for placements
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-[1.1]">
            Everything you need to <span className="text-brand-600">ace your placements</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            LessGo brings interview prep, DSA practice with visualized algorithms, application
            tracking, and a voice mock-interview coach together — clean, minimal, and
            beginner-friendly.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/register"
              className="btn-primary text-base px-6 py-3 hover:scale-[1.03] hover:shadow-lg hover:shadow-brand-500/25 transition-all"
            >
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link
              href="/dashboard"
              className="btn-secondary text-base px-6 py-3 hover:scale-[1.03] transition-all"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <ScrollReveal className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {stats.map((s) => (
            <div key={s.label} className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <p className="text-3xl font-bold text-brand-600">
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
        <ScrollReveal className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold">One platform, every part of prep</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Hover a card — it reacts to you, just like a good prep tool should.
          </p>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 60} className={f.highlight ? "sm:col-span-2 lg:col-span-1" : ""}>
              <ReactiveCard
                as={Link}
                href={f.href}
                className={`card p-6 block h-full ${
                  f.highlight ? "ring-1 ring-brand-200 dark:ring-brand-800" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-11 w-11 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600">
                    <f.icon size={22} />
                  </div>
                  {f.highlight && (
                    <span className="badge bg-brand-600 text-white gap-1">
                      <Sparkles size={10} /> New
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{f.desc}</p>
              </ReactiveCard>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Call to action band */}
      <ScrollReveal className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-24">
        <div className="card p-10 text-center bg-gradient-to-br from-brand-50 to-white dark:from-brand-900/10 dark:to-gray-900">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Ready to see your Readiness Score?</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-base leading-relaxed max-w-xl mx-auto">
            One number, built from everything you do in LessGo — DSA practice, roadmap
            progress, consistency, and your application pipeline.
          </p>
          <Link
            href="/progress"
            className="btn-primary text-base px-6 py-3 inline-flex hover:scale-[1.03] hover:shadow-lg hover:shadow-brand-500/25 transition-all"
          >
            Check My Score <ArrowRight size={18} />
          </Link>
        </div>
      </ScrollReveal>
    </div>
  );
}
