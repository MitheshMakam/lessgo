"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { FileText, Sparkles, Trash2, ChevronDown, ChevronUp, Upload, X, Copy } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const TRACK_LABELS = {
  FAANG: "FAANG",
  PRODUCT_STARTUP: "Product / Startup",
  SERVICE_FRESHER: "Service — Fresher",
};

function StarBuilder({ project, onSaved }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ situation: "", task: "", action: "", result: "" });
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);

  const generate = async () => {
    if (!form.situation || !form.task || !form.action || !form.result) {
      toast.error("Fill in all four STAR fields.");
      return;
    }
    setGenerating(true);
    try {
      const res = await api.post("/resume/star", { projectName: project.name, ...form });
      setGenerated(res.data.generatedAnswer);
      onSaved?.(res.data);
      toast.success("STAR answer generated and saved!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to generate STAR answer.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-brand-600 font-medium inline-flex items-center gap-1"
      >
        <Sparkles size={12} /> {open ? "Hide STAR builder" : "Build STAR answer"}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {["situation", "task", "action", "result"].map((field) => (
            <div key={field}>
              <label className="text-xs font-medium capitalize text-gray-500 dark:text-gray-400">{field}</label>
              <textarea
                rows={2}
                className="input-field text-sm mt-1"
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                placeholder={`Briefly describe the ${field}...`}
              />
            </div>
          ))}
          <button onClick={generate} disabled={generating} className="btn-primary w-full">
            {generating ? "Generating..." : "Generate STAR Answer"}
          </button>

          {generated && (
            <div className="text-sm bg-brand-50 dark:bg-brand-900/20 rounded-lg p-3 mt-2">
              {generated}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResumeAnalyzerPage() {
  const { user, loading: authLoading } = useAuth();
  const [resumeText, setResumeText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileSize, setUploadedFileSize] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [track, setTrack] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [savedAnswers, setSavedAnswers] = useState([]);
  const [expandedSaved, setExpandedSaved] = useState(null);

  useEffect(() => {
    if (!authLoading && user?.track) setTrack(user.track);
  }, [user, authLoading]);

  useEffect(() => {
    if (authLoading || !user) return;
    api.get("/resume/star").then((res) => setSavedAnswers(res.data));
  }, [user, authLoading]);

  const analyze = async () => {
    if (resumeText.trim().length < 50) {
      toast.error("Paste your full resume text first.");
      return;
    }
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await api.post("/resume/analyze", { resumeText, track });
      setAnalysis(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to analyze resume.");
    } finally {
      setAnalyzing(false);
    }
  };

  const uploadResume = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const extension = file.name.toLowerCase().split(".").pop();
    if (!["pdf", "docx"].includes(extension)) {
      toast.error("Choose a PDF or DOCX resume.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Resume file must be 5 MB or smaller.");
      return;
    }
    const body = new FormData();
    body.append("resume", file);
    setUploading(true);
    try {
      const res = await api.post("/resume/upload", body);
      setResumeText(res.data.resumeText);
      setUploadedFileName(res.data.fileName || file.name);
      setUploadedFileSize(file.size);
      setAnalysis(null);
      setComparison(null);
      toast.success("Resume text extracted. Review it below before analyzing.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not read that resume file.");
    } finally {
      setUploading(false);
    }
  };

  const compareResume = async () => {
    if (resumeText.trim().length < 50) {
      toast.error("Add or upload your resume first.");
      return;
    }
    if (jobDescription.trim().length < 100) {
      toast.error("Paste the full job description (at least 100 characters).");
      return;
    }
    setComparing(true);
    setComparison(null);
    try {
      const res = await api.post("/resume/compare", { resumeText, jobDescription, track });
      setComparison(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not compare the resume and job description.");
    } finally {
      setComparing(false);
    }
  };

  const copyText = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard.");
    } catch {
      toast.error("Clipboard access is unavailable in this browser.");
    }
  };

  const deleteStar = async (id) => {
    try {
      await api.delete(`/resume/star/${id}`);
      setSavedAnswers((prev) => prev.filter((s) => s.id !== id));
      toast.success("Removed.");
    } catch {
      toast.error("Failed to remove.");
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:py-28 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Log in to analyze your resume</h1>
        <Link href="/login" className="btn-primary">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h1 className="page-title">Resume Analyzer</h1>
      <p className="page-subtitle">
        Paste your resume, get an ATS-style score against your target track, and turn each
        project into a ready-to-speak STAR interview answer.
      </p>

      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-brand-600" />
          <span className="text-sm font-medium">Paste resume text</span>
        </div>
          <label className="btn-secondary cursor-pointer inline-flex items-center justify-center gap-2 text-sm">
            <Upload size={15} /> {uploading ? "Reading resume..." : "Upload PDF or DOCX"}
            <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={uploadResume} disabled={uploading} />
          </label>
        </div>
        {uploadedFileName && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 dark:border-gray-800 px-3 py-2 mb-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="truncate">Loaded from {uploadedFileName} ({(uploadedFileSize / 1024).toFixed(0)} KB) · text extracted in memory</span>
            <button type="button" aria-label="Clear uploaded resume" onClick={() => { setResumeText(""); setUploadedFileName(""); setUploadedFileSize(0); setAnalysis(null); setComparison(null); }} className="shrink-0 hover:text-red-500"><X size={15} /></button>
          </div>
        )}
        <textarea
          rows={10}
          className="input-field text-sm mb-3"
          value={resumeText}
          onChange={(e) => { setResumeText(e.target.value); setAnalysis(null); setComparison(null); }}
          placeholder="Paste the full text of your resume here..."
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <select className="input-field sm:w-56" value={track} onChange={(e) => setTrack(e.target.value)}>
            <option value="">General (no specific track)</option>
            {Object.entries(TRACK_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <button onClick={analyze} disabled={analyzing} className="btn-primary flex-1">
            {analyzing ? "Analyzing..." : "Analyze Resume"}
          </button>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-brand-600" />
          <h2 className="font-semibold">Compare with a job description</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">See how your documented experience matches this role. Your resume is compared for this request and isn’t saved by this feature.</p>
        <textarea
          rows={7}
          className="input-field text-sm mb-3"
          value={jobDescription}
          onChange={(e) => { setJobDescription(e.target.value); setComparison(null); }}
          placeholder="Paste the full job description here..."
          aria-label="Job description"
        />
        <button onClick={compareResume} disabled={comparing || uploading} className="btn-primary w-full">
          {comparing ? "Comparing..." : "Compare Resume to Job"}
        </button>
      </div>

      {comparison && (
        <div className="card p-6 mb-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="font-semibold">Job Match</h2><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">An estimate of documented evidence coverage, not a hiring prediction.</p></div>
            <span className="text-2xl font-bold text-brand-600 shrink-0">{comparison.matchScore}%</span>
          </div>
          {comparison.scoreExplanation && <p className="text-sm text-gray-600 dark:text-gray-300">{comparison.scoreExplanation}</p>}
          {[
            ["Skills supported by your resume", comparison.matchedSkills, "skill", "evidence"],
            ["Skills with weak evidence", comparison.weakEvidenceSkills, "skill", "howToStrengthen"],
            ["Missing skills", comparison.missingSkills, "skill", "reason"],
            ["Relevant experience", comparison.relevantExperience, "label", "relevance"],
          ].map(([title, items, primary, secondary]) => items?.length > 0 && (
            <section key={title}>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{title}</h3>
              <div className="space-y-2">{items.map((item, i) => <div key={`${title}-${i}`} className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{item[primary]}</span>{item.importance && <span className="badge">{item.importance}</span>}</div>
                {item.evidence && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Evidence: {item.evidence}</p>}
                {item[secondary] && <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{item[secondary]}</p>}
              </div>)}</div>
            </section>
          ))}
          {comparison.requirementsNotDemonstrated?.length > 0 && <section><h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Requirements not demonstrated</h3><ul className="text-sm text-gray-600 dark:text-gray-300 list-disc pl-5 space-y-1">{comparison.requirementsNotDemonstrated.map((x, i) => <li key={i}>{x}</li>)}</ul></section>}
          {comparison.keywordGaps && <section><h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Keyword gaps</h3><div className="flex flex-wrap gap-2">{["high", "medium", "low"].flatMap((level) => (comparison.keywordGaps[level] || []).map((word) => <span key={`${level}-${word}`} className="badge bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">{word} · {level}</span>))}</div></section>}
          {comparison.recommendations?.length > 0 && <section><h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Recommended next edits</h3><div className="space-y-2">{comparison.recommendations.map((item, i) => <div key={i} className="rounded-lg border border-gray-100 dark:border-gray-800 p-3 text-sm"><span className="badge mr-2">{item.priority}</span>{item.action}{item.reason && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.reason}</p>}</div>)}</div></section>}
          {comparison.tailoredSummary && <section><div className="flex items-center justify-between mb-2"><h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Suggested summary</h3><button onClick={() => copyText(comparison.tailoredSummary)} className="text-xs text-brand-600 inline-flex items-center gap-1"><Copy size={13} /> Copy</button></div><p className="text-sm text-gray-600 dark:text-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">{comparison.tailoredSummary}</p></section>}
          {comparison.bulletSuggestions?.length > 0 && <section><h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Evidence-based bullet suggestions</h3><div className="space-y-2">{comparison.bulletSuggestions.map((item, i) => <div key={i} className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 text-sm"><p className="text-xs text-gray-500 dark:text-gray-400">Based on: {item.originalEvidence}</p><p className="mt-1">{item.suggestion}</p><button onClick={() => copyText(item.suggestion)} className="text-xs text-brand-600 inline-flex items-center gap-1 mt-2"><Copy size={13} /> Copy suggestion</button></div>)}</div></section>}
          <button onClick={() => copyText(JSON.stringify(comparison, null, 2))} className="text-xs text-brand-600 inline-flex items-center gap-1"><Copy size={13} /> Copy full report</button>
        </div>
      )}

      {analysis && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold">ATS Match Score</h3>
            <span className="text-2xl font-bold text-brand-600">{analysis.atsScore}%</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div className={`p-3 rounded-lg text-sm ${analysis.missingMetrics ? "bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300" : "bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300"}`}>
              {analysis.missingMetrics ? "⚠ Missing quantified metrics in bullet points" : "✓ Bullet points include quantified impact"}
            </div>
            <div className={`p-3 rounded-lg text-sm ${analysis.missingProjectLinks ? "bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300" : "bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300"}`}>
              {analysis.missingProjectLinks ? "⚠ Projects are missing live/GitHub links" : "✓ Projects include links"}
            </div>
          </div>

          {analysis.missingKeywords?.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Missing Keywords
              </p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.missingKeywords.map((k) => (
                  <span key={k} className="badge bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis.weakPhrasing?.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Weak / Generic Phrasing
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc pl-4 space-y-1">
                {analysis.weakPhrasing.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.detectedProjects?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Detected Projects
              </p>
              <div className="space-y-3">
                {analysis.detectedProjects.map((p, i) => (
                  <div key={i} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{p.description}</p>
                    <StarBuilder
                      project={p}
                      onSaved={(newAnswer) => setSavedAnswers((prev) => [newAnswer, ...prev])}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {savedAnswers.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Your Saved STAR Answers</h3>
          <p className="text-xs text-gray-400 mb-4">
            These are automatically referenced by the AI Mock Interview Bot&apos;s HR round.
          </p>
          <div className="space-y-2">
            {savedAnswers.map((s) => (
              <div key={s.id} className="border border-gray-100 dark:border-gray-800 rounded-lg">
                <button
                  onClick={() => setExpandedSaved(expandedSaved === s.id ? null : s.id)}
                  className="w-full flex items-center justify-between p-3 text-left"
                >
                  <span className="text-sm font-medium">{s.projectName}</span>
                  {expandedSaved === s.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedSaved === s.id && (
                  <div className="px-3 pb-3 flex items-start justify-between gap-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{s.generatedAnswer}</p>
                    <button onClick={() => deleteStar(s.id)} className="text-gray-300 hover:text-red-500 shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
