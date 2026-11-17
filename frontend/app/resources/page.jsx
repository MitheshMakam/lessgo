"use client";

import { useEffect, useState } from "react";
import { Search, Youtube, FileText, BookMarked, ExternalLink, Bookmark } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ReactiveCard from "@/components/ReactiveCard";
import ScrollReveal from "@/components/ScrollReveal";
import { SkeletonCard } from "@/components/Skeleton";

const typeIcons = {
  YOUTUBE: Youtube,
  DOCS: FileText,
  CHEATSHEET: BookMarked,
  PDF: FileText,
  WEBSITE: ExternalLink,
};

const typeFilters = [
  { value: "", label: "All Types" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "DOCS", label: "Docs" },
  { value: "CHEATSHEET", label: "Cheat Sheets" },
  { value: "PDF", label: "PDFs" },
  { value: "WEBSITE", label: "Websites" },
];

export default function ResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(new Set());

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (type) params.type = type;
    if (search) params.search = search;

    const timeout = setTimeout(() => {
      api
        .get("/resources", { params })
        .then((res) => setResources(res.data))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [type, search]);

  const toggleBookmark = async (id) => {
    if (!user) {
      toast.error("Log in to bookmark resources.");
      return;
    }
    try {
      const res = await api.post(`/resources/${id}/bookmark`);
      setBookmarked((prev) => {
        const next = new Set(prev);
        res.data.bookmarked ? next.add(id) : next.delete(id);
        return next;
      });
      toast.success(res.data.bookmarked ? "Bookmarked!" : "Removed from bookmarks.");
    } catch {
      toast.error("Failed to update bookmark.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Free Resources</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 text-base leading-relaxed">
        Curated YouTube videos, docs, cheat sheets, PDFs, and websites — all free.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            className="input-field pl-9"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input-field sm:w-48" value={type} onChange={(e) => setType(e.target.value)}>
          {typeFilters.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((r, i) => {
            const Icon = typeIcons[r.type] || ExternalLink;
            return (
              <ScrollReveal key={r.id} delay={(i % 6) * 50}>
                <ReactiveCard className="card p-5 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600">
                    <Icon size={18} />
                  </div>
                  <button onClick={() => toggleBookmark(r.id)} aria-label="Bookmark">
                    <Bookmark
                      size={18}
                      className={bookmarked.has(r.id) ? "fill-brand-600 text-brand-600" : "text-gray-400"}
                    />
                  </button>
                </div>
                <h3 className="font-semibold mb-1">{r.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex-1">{r.description}</p>
                <div className="flex items-center justify-between">
                  <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {r.category}
                  </span>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-600 font-medium inline-flex items-center gap-1"
                  >
                    Visit <ExternalLink size={14} />
                  </a>
                </div>
                </ReactiveCard>
              </ScrollReveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
