"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Target, Check } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const TRACKS = [
  {
    value: "FAANG",
    label: "FAANG",
    description: "Top-tier product companies. Readiness scoring and DSA ordering lean heavily on algorithmic depth.",
  },
  {
    value: "PRODUCT_STARTUP",
    label: "Product / Startup",
    description: "Growth-stage product companies and startups. Balances DSA, applications, and practical delivery.",
  },
  {
    value: "SERVICE_FRESHER",
    label: "Service — Fresher",
    description: "Service-based companies hiring freshers. Weights fundamentals, aptitude, and roadmap coverage more.",
  },
];

export default function SettingsPage() {
  const { user, loading: authLoading, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);

  const setTrack = async (track) => {
    setSaving(true);
    try {
      const res = await api.put("/auth/track", { track });
      updateUser(res.data.user);
      toast.success("Target track updated!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update track.");
    } finally {
      setSaving(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:py-28 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Log in to change settings</h1>
        <Link href="/login" className="btn-primary">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">
        Set your target track. This tunes DSA question ordering, your Placement Readiness
        Score weighting, and the OA Simulator / AI Mock Interview Bot content — no other
        page changes.
      </p>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Target size={18} className="text-brand-600" />
          <h2 className="font-semibold">Target Track</h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {TRACKS.map((t) => {
            const active = user?.track === t.value;
            return (
              <button
                key={t.value}
                disabled={saving}
                onClick={() => setTrack(t.value)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  active
                    ? "border-brand-600 bg-brand-50 dark:bg-brand-900/20"
                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                } disabled:opacity-60`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-sm">{t.label}</span>
                  {active && <Check size={16} className="text-brand-600" />}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t.description}</p>
              </button>
            );
          })}
        </div>

        {!user?.track && (
          <p className="text-xs text-gray-400 mt-4">
            No track set yet — DSA ordering and readiness scoring use their default, track-neutral behavior until you pick one.
          </p>
        )}
      </div>
    </div>
  );
}
