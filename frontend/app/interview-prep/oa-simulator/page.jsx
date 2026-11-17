"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Clock, ExternalLink, ArrowLeft, Trophy } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const TRACK_LABELS = {
  FAANG: "FAANG",
  PRODUCT_STARTUP: "Product / Startup",
  SERVICE_FRESHER: "Service — Fresher",
};

export default function OASimulatorPage() {
  const { user, loading: authLoading } = useAuth();
  const [track, setTrack] = useState("");
  const [phase, setPhase] = useState("select"); // select | running | result
  const [session, setSession] = useState(null);
  const [aptitudeAnswers, setAptitudeAnswers] = useState({}); // questionId -> selectedIndex
  const [codingSolved, setCodingSolved] = useState(new Set());
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!authLoading && user?.track) setTrack(user.track);
  }, [user, authLoading]);

  useEffect(() => {
    if (phase !== "running") return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const startAttempt = async () => {
    if (!track) {
      toast.error("Pick a track first.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/oa-simulator/start", { track });
      setSession(res.data);
      setAptitudeAnswers({});
      setCodingSolved(new Set());
      setSecondsLeft(res.data.durationMinutes * 60);
      setStartedAt(Date.now());
      setPhase("running");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to start the simulator.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCoding = (id) => {
    setCodingSolved((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    clearInterval(timerRef.current);
    const timeTakenSeconds = Math.round((Date.now() - startedAt) / 1000);

    try {
      const res = await api.post("/oa-simulator/submit", {
        track,
        timeTakenSeconds,
        aptitudeAnswers: Object.entries(aptitudeAnswers).map(([questionId, selectedIndex]) => ({
          questionId,
          selectedIndex,
        })),
        codingSolvedIds: [...codingSolved],
      });
      setResult(res.data);
      setPhase("result");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit attempt.");
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:py-28 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Log in to take an OA Simulator</h1>
        <Link href="/login" className="btn-primary">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Link href="/interview-prep" className="text-sm text-brand-600 inline-flex items-center gap-1 mb-4">
        <ArrowLeft size={14} /> Back to Interview Prep
      </Link>
      <h1 className="page-title">OA Simulator</h1>
      <p className="page-subtitle">
        A timed mock test matching your target track&apos;s typical online assessment format.
      </p>

      {phase === "select" && (
        <div className="card p-6">
          <p className="text-sm font-medium mb-3">Choose a track for this attempt</p>
          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            {Object.entries(TRACK_LABELS).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTrack(value)}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  track === value
                    ? "border-brand-600 bg-brand-50 dark:bg-brand-900/20"
                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button onClick={startAttempt} disabled={loading || !track} className="btn-primary w-full">
            {loading ? "Preparing your OA..." : "Start Timed OA"}
          </button>
        </div>
      )}

      {phase === "running" && session && (
        <div className="space-y-6">
          <div className="card p-4 flex items-center justify-between sticky top-20 z-10">
            <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
              {TRACK_LABELS[track]} format
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-brand-600">
              <Clock size={16} /> {formatTime(secondsLeft)}
            </span>
          </div>

          {session.sections.map((section) => (
            <div key={section.section} className="card p-6">
              <h3 className="font-semibold mb-4">{section.section}</h3>

              {section.section === "Aptitude" &&
                section.questions.map((q, i) => (
                  <div key={q.id} className="mb-5 last:mb-0">
                    <p className="text-sm font-medium mb-2">
                      {i + 1}. {q.title}
                    </p>
                    <div className="space-y-1.5">
                      {q.options?.map((opt, idx) => (
                        <label
                          key={idx}
                          className={`flex items-center gap-2 p-2 rounded-lg text-sm cursor-pointer transition-colors ${
                            aptitudeAnswers[q.id] === idx
                              ? "bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            checked={aptitudeAnswers[q.id] === idx}
                            onChange={() => setAptitudeAnswers((prev) => ({ ...prev, [q.id]: idx }))}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

              {section.section === "Coding" &&
                section.questions.map((p, i) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={codingSolved.has(p.id)}
                      onChange={() => toggleCoding(p.id)}
                    />
                    <span className="flex-1 text-sm">
                      {i + 1}. {p.title}{" "}
                      <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 ml-1">
                        {p.difficulty}
                      </span>
                    </span>
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-brand-600"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </label>
                ))}
            </div>
          ))}

          <button onClick={handleSubmit} className="btn-primary w-full">
            Submit OA
          </button>
        </div>
      )}

      {phase === "result" && result && (
        <div className="card p-8 text-center">
          <Trophy className="mx-auto text-yellow-500 mb-3" size={36} />
          <p className="text-4xl font-bold mb-1">{result.totalScore}%</p>
          <p className="text-sm text-gray-500 mb-6">
            {result.correctCount} correct · {result.incorrectCount} incorrect · {Math.round(result.timeTakenSeconds / 60)} min taken
          </p>

          <div className="space-y-3 text-left mb-6">
            {result.sectionBreakdown.map((s) => (
              <div key={s.section}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{s.section}</span>
                  <span className="font-medium">
                    {s.correct}/{s.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-brand-600 h-2 rounded-full"
                    style={{ width: `${s.total ? (s.correct / s.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setPhase("select");
              setResult(null);
            }}
            className="btn-secondary w-full"
          >
            Take Another Attempt
          </button>
        </div>
      )}
    </div>
  );
}
