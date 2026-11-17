"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ExternalLink, ChevronDown, ChevronUp, Lightbulb, Clock, Database, Sparkles } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { SkeletonRow } from "@/components/Skeleton";
import DSAVisualizer from "@/components/DSAVisualizer";

const difficultyColors = {
  EASY: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300",
  MEDIUM: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300",
  HARD: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300",
};

const statusOptions = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "ATTEMPTED", label: "Attempted" },
  { value: "SOLVED", label: "Solved" },
];

function ProblemDetail({ problem }) {
  const [revealedHints, setRevealedHints] = useState(0);

  return (
    <div className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/30">
      {/* Complexity badges */}
      {(problem.timeComplexity || problem.spaceComplexity) && (
        <div className="flex flex-wrap gap-2">
          {problem.timeComplexity && (
            <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 gap-1">
              <Clock size={12} /> Time: {problem.timeComplexity}
            </span>
          )}
          {problem.spaceComplexity && (
            <span className="badge bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 gap-1">
              <Database size={12} /> Space: {problem.spaceComplexity}
            </span>
          )}
        </div>
      )}

      {/* Approach walkthrough */}
      {problem.approach && (
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            Approach
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{problem.approach}</p>
        </div>
      )}

      {/* Progressive hints */}
      {problem.hints?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Hints
            </p>
            {revealedHints < problem.hints.length && (
              <button
                onClick={() => setRevealedHints((r) => r + 1)}
                className="text-xs text-brand-600 font-medium inline-flex items-center gap-1"
              >
                <Lightbulb size={12} /> Reveal Hint {revealedHints + 1}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {problem.hints.slice(0, revealedHints).map((h, i) => (
              <div
                key={i}
                className="text-sm text-gray-700 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg p-3"
              >
                <span className="font-semibold text-yellow-700 dark:text-yellow-400">Hint {i + 1}: </span>
                {h}
              </div>
            ))}
            {revealedHints === 0 && (
              <p className="text-xs text-gray-400 italic">Stuck? Reveal hints one at a time above.</p>
            )}
          </div>
        </div>
      )}

      {/* Step-by-step visualizer */}
      {problem.visualizationSteps?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Sparkles size={12} /> Visualize the Algorithm
          </p>
          <DSAVisualizer steps={problem.visualizationSteps} />
        </div>
      )}
    </div>
  );
}

export default function DSAPage() {
  const { user, loading: authLoading } = useAuth();
  const [problems, setProblems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [difficulty, setDifficulty] = useState("");
  const [status, setStatus] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const load = () => {
    const params = {};
    if (difficulty) params.difficulty = difficulty;
    if (status) params.status = status;
    if (company) params.company = company;

    setLoading(true);
    api
      .get("/leetcode/problems", { params })
      .then((res) => setProblems(res.data))
      .finally(() => setLoading(false));

    api.get("/leetcode/progress-summary").then((res) => setSummary(res.data));
  };

  useEffect(() => {
    if (authLoading || !user) return;
    api.get("/leetcode/companies").then((res) => setCompanies(res.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  useEffect(() => {
    if (authLoading || !user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, status, company, user, authLoading]);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/leetcode/problems/${id}/status`, { status: newStatus });
      setProblems((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
      toast.success("Progress updated!");
    } catch {
      toast.error("Failed to update status.");
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:py-28 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Log in to track your DSA progress</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-base leading-relaxed">
          Save your progress, unlock hints, and visualize algorithms as you practice.
        </p>
        <Link href="/login" className="btn-primary">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">DSA Practice</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 text-base leading-relaxed">
        Track your progress, get unstuck with hints, and visualize how each algorithm works.
      </p>

      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{summary.solved}</p>
            <p className="text-xs text-gray-500">Solved</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{summary.attempted}</p>
            <p className="text-xs text-gray-500">Attempted</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-gray-400">{summary.remaining}</p>
            <p className="text-xs text-gray-500">Remaining</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select className="input-field sm:w-48" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="">All Difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
        <select className="input-field sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select className="input-field sm:w-48" value={company} onChange={(e) => setCompany(e.target.value)}>
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {problems.map((p) => (
            <div key={p.id} className="card overflow-hidden">
              <div className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                <button
                  className="flex-1 min-w-0 flex items-center gap-3 text-left"
                  onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                >
                  <span className="text-gray-400 text-sm w-6 shrink-0">{p.slNo}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{p.title}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className={`badge ${difficultyColors[p.difficulty]}`}>{p.difficulty}</span>
                      <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {p.topic}
                      </span>
                      {p.companyTags?.slice(0, 3).map((c) => (
                        <span
                          key={c}
                          className="badge bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                        >
                          {c}
                        </span>
                      ))}
                      {(p.hints?.length > 0 || p.visualizationSteps?.length > 0) && (
                        <span className="badge bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 gap-1">
                          <Lightbulb size={10} /> Hints available
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                <select
                  className="input-field py-1.5 text-xs w-32 shrink-0"
                  value={p.status}
                  onChange={(e) => updateStatus(p.id, e.target.value)}
                >
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <a
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 shrink-0"
                  aria-label="Open on LeetCode"
                >
                  <ExternalLink size={16} />
                </a>
                <button
                  onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                  className="shrink-0"
                  aria-label={expanded === p.id ? "Collapse" : "Expand"}
                >
                  {expanded === p.id ? (
                    <ChevronUp size={18} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-400" />
                  )}
                </button>
              </div>

              {expanded === p.id && <ProblemDetail problem={p} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
