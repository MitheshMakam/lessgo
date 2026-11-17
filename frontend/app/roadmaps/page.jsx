"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import ReactiveCard from "@/components/ReactiveCard";
import ScrollReveal from "@/components/ScrollReveal";
import { SkeletonCard } from "@/components/Skeleton";

export default function RoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/roadmaps")
      .then((res) => setRoadmaps(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Learning Roadmaps</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 text-base leading-relaxed">
        Step-by-step guided paths to help you learn in the right order.
      </p>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {roadmaps.map((r, i) => (
            <ScrollReveal key={r.id} delay={i * 70}>
              <ReactiveCard as={Link} href={`/roadmaps/${r.id}`} className="card p-6 block h-full">
                <div className="text-3xl mb-3">{r.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{r.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{r.description}</p>
                <span className="text-xs text-gray-400">{r._count.steps} steps</span>
              </ReactiveCard>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  );
}
