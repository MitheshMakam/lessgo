"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Plus, X, Trash2, Building2 } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/Skeleton";

const stages = [
  { value: "APPLIED", label: "Applied", color: "bg-gray-100 dark:bg-gray-800" },
  { value: "OA_SCHEDULED", label: "OA Scheduled", color: "bg-blue-50 dark:bg-blue-900/20" },
  { value: "OA_DONE", label: "OA Done", color: "bg-indigo-50 dark:bg-indigo-900/20" },
  { value: "INTERVIEW", label: "Interview", color: "bg-yellow-50 dark:bg-yellow-900/20" },
  { value: "OFFER", label: "Offer 🎉", color: "bg-green-50 dark:bg-green-900/20" },
  { value: "REJECTED", label: "Rejected", color: "bg-red-50 dark:bg-red-900/20" },
];

export default function ApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ companyName: "", role: "", notes: "" });
  const [dragId, setDragId] = useState(null);

  const load = () => {
    api
      .get("/applications")
      .then((res) => setApplications(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading || !user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const addApplication = async (e) => {
    e.preventDefault();
    if (!form.companyName.trim() || !form.role.trim()) {
      toast.error("Company name and role are required.");
      return;
    }
    try {
      const res = await api.post("/applications", form);
      setApplications((prev) => [res.data, ...prev]);
      setForm({ companyName: "", role: "", notes: "" });
      setShowForm(false);
      toast.success("Application added!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add application.");
    }
  };

  const moveStage = async (id, newStage) => {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, stage: newStage } : a)));
    try {
      await api.put(`/applications/${id}`, { stage: newStage });
    } catch {
      toast.error("Failed to update stage.");
      load();
    }
  };

  const removeApplication = async (id) => {
    try {
      await api.delete(`/applications/${id}`);
      setApplications((prev) => prev.filter((a) => a.id !== id));
      toast.success("Application removed.");
    } catch {
      toast.error("Failed to delete application.");
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:py-28 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Log in to track applications</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-base leading-relaxed">
          Keep every company you&apos;ve applied to organized in one Kanban board.
        </p>
        <Link href="/login" className="btn-primary">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Application Tracker</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "Add Application"}
        </button>
      </div>
      <p className="text-gray-500 dark:text-gray-400 mb-8 text-base leading-relaxed">
        Drag cards between columns as your application progresses.
      </p>

      {showForm && (
        <form onSubmit={addApplication} className="card p-5 mb-6 grid sm:grid-cols-3 gap-3">
          <input
            className="input-field"
            placeholder="Company name"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          />
          <input
            className="input-field"
            placeholder="Role (e.g. SDE Intern)"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          />
          <input
            className="input-field"
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <button type="submit" className="btn-primary sm:col-span-3">
            Save Application
          </button>
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl p-3 bg-gray-100 dark:bg-gray-800/50 min-h-[200px] space-y-2">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {stages.map((stage) => {
            const items = applications.filter((a) => a.stage === stage.value);
            return (
              <div
                key={stage.value}
                className={`rounded-xl p-3 ${stage.color} min-h-[200px]`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragId) moveStage(dragId, stage.value);
                  setDragId(null);
                }}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="font-semibold text-sm">{stage.label}</h3>
                  <span className="text-xs text-gray-400">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((app) => (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={() => setDragId(app.id)}
                      className="card p-3 cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <Building2 size={14} className="mt-0.5 text-brand-600 shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{app.companyName}</p>
                            <p className="text-xs text-gray-500">{app.role}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeApplication(app.id)}
                          className="text-gray-300 hover:text-red-500 shrink-0"
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {app.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{app.notes}</p>
                      )}
                      {/* Mobile-friendly stage selector, since drag-and-drop is awkward on touch */}
                      <select
                        className="input-field mt-2 py-1 text-xs sm:hidden"
                        value={app.stage}
                        onChange={(e) => moveStage(app.id, e.target.value)}
                      >
                        {stages.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
