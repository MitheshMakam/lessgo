"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ChevronDown, ChevronUp, Timer, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { SkeletonRow } from "@/components/Skeleton";

const categories = [
  { value: "", label: "All Categories" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "APTITUDE", label: "Aptitude" },
  { value: "HR", label: "HR" },
  { value: "CS_SUBJECT", label: "CS Subjects" },
];

export default function InterviewPrepPage() {
  const [companies, setCompanies] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [company, setCompany] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/interview/companies").then((res) => setCompanies(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (company) params.company = company;
    if (category) params.category = category;
    if (search) params.search = search;

    const timeout = setTimeout(() => {
      api
        .get("/interview/questions", { params })
        .then((res) => setQuestions(res.data))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [company, category, search]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Interview Preparation</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 text-base leading-relaxed">
        Company-wise technical questions, aptitude, HR rounds, and CS subjects.
      </p>

      {/* Additive: entry point to the new OA Simulator. Existing filters/list below are untouched. */}
      <Link
        href="/interview-prep/oa-simulator"
        className="card p-4 mb-8 flex items-center justify-between gap-3 hover:border-brand-300 dark:hover:border-brand-800 border border-transparent transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 shrink-0">
            <Timer size={18} />
          </div>
          <div>
            <p className="font-medium text-sm">New: OA Simulator</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Take a timed mock test matching your target track's typical OA format.
            </p>
          </div>
        </div>
        <ArrowRight size={16} className="text-brand-600 shrink-0" />
      </Link>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            className="input-field pl-9"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input-field sm:w-48" value={company} onChange={(e) => setCompany(e.target.value)}>
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name} ({c._count.questions})
            </option>
          ))}
        </select>
        <select className="input-field sm:w-48" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Questions list */}
      {loading ? (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <p className="text-gray-500">No questions match your filters.</p>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="card overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left"
                onClick={() => setExpanded(expanded === q.id ? null : q.id)}
              >
                <div>
                  <p className="font-medium">{q.title}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {q.company && (
                      <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                        {q.company.name}
                      </span>
                    )}
                    <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {q.category.replace("_", " ")}
                    </span>
                    <span className="badge bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
                      {q.difficulty}
                    </span>
                  </div>
                </div>
                {expanded === q.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {expanded === q.id && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3 text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p>{q.content}</p>
                  {q.answer && (
                    <p>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">Answer: </span>
                      {q.answer}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
