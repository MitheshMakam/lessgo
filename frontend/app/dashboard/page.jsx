"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Code2, Map, Bookmark, StickyNote, Flame, Briefcase, Gauge } from "lucide-react";
import { SkeletonCard } from "@/components/Skeleton";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    api
      .get("/dashboard")
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:py-28 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Log in to see your dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-base leading-relaxed">
          Track DSA progress, roadmap completion, and bookmarks in one place.
        </p>
        <Link href="/login" className="btn-primary">
          Log In
        </Link>
      </div>
    );
  }

  const solvedPct = stats?.leetcode?.total
    ? Math.round((stats.leetcode.solved / stats.leetcode.total) * 100)
    : 0;
  const roadmapPct = stats?.roadmaps?.totalSteps
    ? Math.round((stats.roadmaps.completedSteps / stats.roadmaps.totalSteps) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
        Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""} 👋
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Here&apos;s a snapshot of your prep journey.
      </p>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="card p-6 sm:col-span-2 lg:col-span-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-white/15 flex items-center justify-center">
                <Gauge size={24} />
              </div>
              <div>
                <p className="font-semibold">See your Placement Readiness Score</p>
                <p className="text-sm text-brand-100">
                  One number combining DSA, roadmaps, streak, and applications.
                </p>
              </div>
            </div>
            <Link href="/progress" className="bg-white text-brand-700 hover:bg-brand-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
              Check My Score
            </Link>
          </div>

          <div className="card p-6 bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/10 dark:to-gray-900">
            <div className="flex items-center gap-2 text-orange-500 mb-3">
              <Flame size={20} />
              <span className="font-medium">Streak</span>
            </div>
            <p className="text-3xl font-bold">{stats?.streak?.currentStreak ?? 0} days</p>
            <p className="text-sm text-gray-500 mt-1">
              longest: {stats?.streak?.longestStreak ?? 0} days
            </p>
            <Link href="/progress" className="text-sm text-brand-600 font-medium mt-3 inline-block">
              View full analytics →
            </Link>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 text-brand-600 mb-3">
              <Briefcase size={20} />
              <span className="font-medium">Applications</span>
            </div>
            <p className="text-3xl font-bold">
              {stats?.applications?.total ?? 0}
              <span className="text-base font-normal text-gray-400"> total</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">{stats?.applications?.offers ?? 0} offers received</p>
            <Link href="/applications" className="text-sm text-brand-600 font-medium mt-3 inline-block">
              Open tracker →
            </Link>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 text-brand-600 mb-3">
              <Code2 size={20} />
              <span className="font-medium">DSA</span>
            </div>
            <p className="text-3xl font-bold">
              {stats?.leetcode?.solved ?? 0}
              <span className="text-base font-normal text-gray-400"> / {stats?.leetcode?.total ?? 0}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">problems solved ({solvedPct}%)</p>
            <Link href="/dsa" className="text-sm text-brand-600 font-medium mt-3 inline-block">
              Continue practicing →
            </Link>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 text-brand-600 mb-3">
              <Map size={20} />
              <span className="font-medium">Roadmaps</span>
            </div>
            <p className="text-3xl font-bold">
              {stats?.roadmaps?.completedSteps ?? 0}
              <span className="text-base font-normal text-gray-400"> / {stats?.roadmaps?.totalSteps ?? 0}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">steps completed ({roadmapPct}%)</p>
            <Link href="/roadmaps" className="text-sm text-brand-600 font-medium mt-3 inline-block">
              View roadmaps →
            </Link>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 text-brand-600 mb-3">
              <Bookmark size={20} />
              <span className="font-medium">Bookmarks</span>
            </div>
            <p className="text-3xl font-bold">{stats?.bookmarksCount ?? 0}</p>
            <p className="text-sm text-gray-500 mt-1">saved resources</p>
            <Link href="/resources" className="text-sm text-brand-600 font-medium mt-3 inline-block">
              Browse resources →
            </Link>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 text-brand-600 mb-3">
              <StickyNote size={20} />
              <span className="font-medium">Notes</span>
            </div>
            <p className="text-3xl font-bold">{stats?.notesCount ?? 0}</p>
            <p className="text-sm text-gray-500 mt-1">notes written</p>
            <Link href="/dsa" className="text-sm text-brand-600 font-medium mt-3 inline-block">
              Review problems →
            </Link>
          </div>

          <div className="card p-6 sm:col-span-2 lg:col-span-4 flex items-center gap-4">
            <CheckCircle2 className="text-green-500 shrink-0" size={28} />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Keep the streak going! Consistency beats intensity — try to solve at least
              one problem and revisit one roadmap step every day.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
