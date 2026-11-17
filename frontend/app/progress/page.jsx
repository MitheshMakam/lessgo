"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Trophy, Gauge, ArrowRight, Sparkles, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import ProgressRing from "@/components/ProgressRing";
import { SkeletonCard } from "@/components/Skeleton";

function scoreColor(score) {
  if (score >= 75) return { stroke: "#16a34a", text: "text-green-600", label: "Placement Ready" };
  if (score >= 50) return { stroke: "#3388ff", text: "text-brand-600", label: "Good Progress" };
  if (score >= 25) return { stroke: "#eab308", text: "text-yellow-600", label: "Getting Started" };
  return { stroke: "#ef4444", text: "text-red-500", label: "Just Beginning" };
}

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const [readiness, setReadiness] = useState(null);
  const [topics, setTopics] = useState([]);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [studyPlan, setStudyPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [minutesPerDay, setMinutesPerDay] = useState(45);

  useEffect(() => {
    if (authLoading || !user) return;
    Promise.all([
      api.get("/analytics/readiness"),
      api.get("/analytics/topics"),
      api.get("/analytics/streak"),
    ])
      .then(([readinessRes, topicsRes, streakRes]) => {
        setReadiness(readinessRes.data);
        setTopics(topicsRes.data);
        setStreak(streakRes.data);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  useEffect(() => {
    if (!readiness) return;
    const start = performance.now();
    const duration = 1000;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setAnimatedScore(Math.round(progress * readiness.overall));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [readiness]);

  const generateStudyPlan = async () => {
    setPlanLoading(true);
    try {
      const res = await api.post("/analytics/study-plan", { minutesPerDay });
      setStudyPlan(res.data);
      toast.success("Your personalized study plan is ready.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not generate your study plan.");
    } finally {
      setPlanLoading(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:py-28 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Log in to see your progress</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-base leading-relaxed">
          Your Readiness Score, streak, and topic breakdown all live here once you&apos;re logged in.
        </p>
        <Link href="/login" className="btn-primary">
          Log In
        </Link>
      </div>
    );
  }

  if (loading || !readiness) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="h-7 w-56 mb-8 animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  const colors = scoreColor(readiness.overall);
  const size = 200;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Your Progress</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Readiness score, daily consistency, and topic-wise breakdown — all in one place.
      </p>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Readiness score gauge */}
        <div className="card p-6 flex flex-col items-center justify-center lg:col-span-1">
          <div className="flex items-center gap-2 text-brand-600 mb-2">
            <Gauge size={18} />
            <span className="font-semibold text-sm">Placement Readiness</span>
          </div>
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-gray-200 dark:stroke-gray-800" />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={stroke}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                stroke={colors.stroke}
                style={{ transition: "stroke-dashoffset 1s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">{animatedScore}</span>
              <span className="text-xs text-gray-400">out of 100</span>
            </div>
          </div>
          <p className={`mt-3 font-semibold text-sm ${colors.text}`}>{colors.label}</p>
        </div>

        {/* Streak summary */}
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-5">
          <div className="card p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500">
              <Flame size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{streak?.currentStreak ?? 0} days</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current streak</p>
            </div>
          </div>
          <div className="card p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center text-yellow-500">
              <Trophy size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{streak?.longestStreak ?? 0} days</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Longest streak</p>
            </div>
          </div>

          {/* Last 30 days activity calendar */}
          <div className="card p-6 sm:col-span-2">
            <h3 className="font-semibold mb-4 text-sm">Last 30 days</h3>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(20px, 1fr))" }}>
              {streak?.last30.map((d) => (
                <div
                  key={d.date}
                  title={d.date}
                  className={`h-5 w-5 rounded transition-colors ${
                    d.active ? "bg-brand-600" : "bg-gray-100 dark:bg-gray-800"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Score breakdown */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Score Breakdown</h3>
          <div className="space-y-4">
            {readiness.breakdown.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{b.label}</span>
                  <span className="font-medium">{b.score}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-brand-600 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${b.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4">What to do next</h3>
          <div className="space-y-3">
            {readiness.suggestions.map((s, i) => (
              <Link
                key={i}
                href={s.href}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">{s.text}</span>
                <ArrowRight size={16} className="text-brand-600 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Topic-wise progress rings */}
      <div className="card p-6">
        <h3 className="font-semibold mb-5">DSA Topic Breakdown</h3>
        {topics.length === 0 ? (
          <p className="text-sm text-gray-500">No problems available yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
            {topics.map((t) => (
              <ProgressRing
                key={t.topic}
                percent={t.total ? Math.round((t.solved / t.total) * 100) : 0}
                label={`${t.topic} (${t.solved}/${t.total})`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="card p-6 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div>
            <h3 className="font-semibold inline-flex items-center gap-2"><Sparkles size={16} className="text-brand-600" /> Personalized Study Plan</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">A weekly plan based on your DSA, roadmap, and AI interview progress.</p>
          </div>
          <div className="flex gap-2 items-center">
            <label htmlFor="study-minutes" className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Time per day</label>
            <select id="study-minutes" className="input-field w-28 text-sm" value={minutesPerDay} onChange={(e) => setMinutesPerDay(Number(e.target.value))}>
              {[30, 45, 60, 90, 120].map((minutes) => <option key={minutes} value={minutes}>{minutes} min</option>)}
            </select>
          </div>
        </div>
        <button onClick={generateStudyPlan} disabled={planLoading} className="btn-primary w-full sm:w-auto">
          <RefreshCw size={15} className={planLoading ? "animate-spin" : ""} />
          {planLoading ? "Building your plan..." : studyPlan ? "Refresh Study Plan" : "Generate Study Plan"}
        </button>

        {studyPlan && (
          <div className="mt-5 space-y-5">
            {studyPlan.summary && <p className="text-sm text-gray-600 dark:text-gray-300">{studyPlan.summary}</p>}
            {studyPlan.dataLimitations?.length > 0 && <p className="text-xs text-gray-500 dark:text-gray-400 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">Based on limited history: {studyPlan.dataLimitations.join(" ")}</p>}
            {studyPlan.weakAreas?.length > 0 && <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Focus areas from your activity</h4>
              <div className="grid sm:grid-cols-2 gap-3">{studyPlan.weakAreas.map((area, i) => <div key={`${area.area}-${i}`} className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                <p className="font-medium text-sm">{area.area}</p>
                {area.evidence && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{area.evidence}</p>}
                {area.focus && <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Next: {area.focus}</p>}
              </div>)}</div>
            </div>}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Your 7-day plan · {studyPlan.minutesPerDay} minutes per day</h4>
              <div className="grid sm:grid-cols-2 gap-3">{studyPlan.days.map((day) => {
                const href = day.areaType === "roadmap" ? "/roadmaps" : day.areaType === "interview" ? "/mock-interview" : "/dsa";
                return <div key={day.day} className="rounded-lg border border-gray-100 dark:border-gray-800 p-4">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-xs text-brand-600 font-semibold">DAY {day.day}</p><p className="font-medium text-sm mt-1">{day.focus}</p></div><span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">{day.minutes} min</span></div>
                  {day.tasks?.length > 0 && <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc pl-4 mt-2 space-y-1">{day.tasks.map((task, i) => <li key={i}>{task}</li>)}</ul>}
                  {day.why && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{day.why}</p>}
                  <Link href={href} className="inline-flex items-center gap-1 text-xs text-brand-600 mt-3">Open {day.areaType === "roadmap" ? "Roadmaps" : day.areaType === "interview" ? "Mock Interview" : "DSA"} <ArrowRight size={13} /></Link>
                </div>;
              })}</div>
            </div>
            {studyPlan.reminder && <p className="text-xs text-gray-500 dark:text-gray-400">{studyPlan.reminder}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
