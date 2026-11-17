"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/Skeleton";

export default function RoadmapDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api
      .get(`/roadmaps/${id}`)
      .then((res) => setRoadmap(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleStep = async (stepId) => {
    if (!user) {
      toast.error("Log in to track your roadmap progress.");
      return;
    }
    try {
      await api.put(`/roadmaps/steps/${stepId}/toggle`);
      setRoadmap((prev) => ({
        ...prev,
        steps: prev.steps.map((s) => (s.id === stepId ? { ...s, completed: !s.completed } : s)),
      }));
    } catch {
      toast.error("Failed to update step.");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <Skeleton className="h-8 w-64 mb-3" />
        <Skeleton className="h-4 w-full max-w-md mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 flex items-start gap-3">
              <Skeleton className="h-6 w-6 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return <p className="text-center py-24 text-gray-500">Roadmap not found.</p>;
  }

  const completedCount = roadmap.steps.filter((s) => s.completed).length;
  const pct = Math.round((completedCount / roadmap.steps.length) * 100);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{roadmap.icon}</span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{roadmap.title}</h1>
      </div>
      <p className="text-gray-500 dark:text-gray-400 mb-4">{roadmap.description}</p>

      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 mb-1">
        <div className="bg-brand-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-500 mb-8">
        {completedCount} / {roadmap.steps.length} steps completed ({pct}%)
      </p>

      <div className="space-y-3">
        {roadmap.steps.map((step, idx) => (
          <div key={step.id} className="card p-4 flex items-start gap-3">
            <button onClick={() => toggleStep(step.id)} className="mt-0.5 shrink-0">
              {step.completed ? (
                <CheckCircle2 className="text-green-500" size={22} />
              ) : (
                <Circle className="text-gray-300 dark:text-gray-600" size={22} />
              )}
            </button>
            <div className="flex-1">
              <p className={`font-medium ${step.completed ? "line-through text-gray-400" : ""}`}>
                {idx + 1}. {step.title}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{step.description}</p>
              {step.resourceUrl && (
                <a
                  href={step.resourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-600 inline-flex items-center gap-1 mt-2"
                >
                  Resource <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
