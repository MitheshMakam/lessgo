"use client";

import { useEffect, useRef, useState } from "react";
import { SkipForward, RotateCcw, Play, Bot, Mic2, Flag, Code2, Users, Layers, Sparkles, User } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import VoiceOrb from "@/components/VoiceOrb";
import { useAuth } from "@/context/AuthContext";

// Very small heuristic feedback engine — no external AI API required.
// Looks at answer length, filler-word usage, and keyword overlap with the
// question bank's stored "answer" (when available) to give quick, honest feedback.
// Used only by Classic Practice mode — unchanged from before.
function analyzeAnswer(transcript, referenceAnswer) {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const fillerWords = ["um", "uh", "like", "basically", "actually", "you know"];
  const fillerCount = words.filter((w) => fillerWords.includes(w.toLowerCase())).length;

  let keywordScore = null;
  if (referenceAnswer) {
    const refWords = new Set(
      referenceAnswer.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 4)
    );
    const answerWords = new Set(transcript.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/));
    let hits = 0;
    refWords.forEach((w) => {
      if (answerWords.has(w)) hits += 1;
    });
    keywordScore = refWords.size ? Math.round((hits / refWords.size) * 100) : null;
  }

  const notes = [];
  if (wordCount < 15) {
    notes.push("Your answer was quite short — try elaborating with a concrete example.");
  } else if (wordCount > 150) {
    notes.push("Good depth, but watch the length — aim to be concise and structured.");
  } else {
    notes.push("Good length — clear and reasonably concise.");
  }

  if (fillerCount > 3) {
    notes.push(`You used filler words (${fillerCount} times) — try pausing instead of saying "um"/"like".`);
  } else {
    notes.push("Minimal filler words — sounded confident.");
  }

  if (keywordScore !== null) {
    if (keywordScore >= 50) {
      notes.push(`Strong keyword overlap (${keywordScore}%) with the ideal answer.`);
    } else {
      notes.push(`Keyword overlap was low (${keywordScore}%) — review the ideal answer below.`);
    }
  }

  let spokenVerdict;
  if (wordCount >= 15 && fillerCount <= 3 && (keywordScore === null || keywordScore >= 50)) {
    spokenVerdict = "That was a solid answer. Well structured and confident.";
  } else if (wordCount < 15) {
    spokenVerdict = "That's a good start, but try to elaborate more next time with a specific example.";
  } else if (fillerCount > 3) {
    spokenVerdict = "Good content, but watch your filler words — try pausing instead.";
  } else {
    spokenVerdict = "Decent attempt. Take a look at the ideal answer to fill in the gaps.";
  }

  return { wordCount, fillerCount, keywordScore, notes, spokenVerdict };
}

const GREETINGS = [
  "Hi there, thanks for joining. Let's get started with a quick mock interview.",
  "Welcome! I'll ask you a few questions — just answer naturally, like a real interview.",
  "Good to see you. Let's begin — take your time with each answer.",
];
const TRANSITIONS = [
  "Alright, next question.",
  "Let's move on.",
  "Okay, here's another one.",
  "Great, moving forward.",
];

const ROUND_TYPES = [
  { value: "TECHNICAL", label: "Technical", desc: "Coding & problem-solving", icon: Code2 },
  { value: "HR", label: "HR / Behavioral", desc: "STAR-based, references your saved answers", icon: Users },
  { value: "SYSTEM_DESIGN", label: "System Design", desc: "Architecture & trade-offs", icon: Layers, faangOnly: true },
];

export default function MockInterviewPage() {
  const { user } = useAuth();

  // --- Shared state (used by both modes) ---
  const [mode, setMode] = useState("classic"); // classic | bot — classic is the default, unchanged behavior
  const [orbState, setOrbState] = useState("idle"); // idle | speaking | listening | thinking
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
  const [voices, setVoices] = useState([]);
  const recognitionRef = useRef(null);

  // --- Classic Practice mode state (unchanged from before) ---
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [voiceAiFeedback, setVoiceAiFeedback] = useState(null);
  const [voiceAiLoading, setVoiceAiLoading] = useState(false);

  // --- AI Interview Bot mode state (new, additive) ---
  const [roundType, setRoundType] = useState("TECHNICAL");
  const [botSession, setBotSession] = useState(null);
  const [botFeedback, setBotFeedback] = useState(null);
  const [botLoading, setBotLoading] = useState(false);

  useEffect(() => {
    api.get("/interview/questions").then((res) => setQuestions(res.data));

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let text = "";
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript + " ";
        }
        setTranscript(text.trim());
      };

      recognition.onerror = () => {
        toast.error("Microphone error — check your browser permissions.");
        setOrbState("idle");
      };

      recognitionRef.current = recognition;
    }

    const loadVoices = () => {
      const available = window.speechSynthesis?.getVoices() || [];
      setVoices(available);
      if (available.length && !selectedVoiceURI) {
        const preferredNames = [
          "Google UK English Female", "Google US English", "Microsoft Zira",
          "Microsoft David", "Samantha", "Daniel",
        ];
        const match =
          available.find((v) => preferredNames.includes(v.name)) ||
          available.find((v) => v.lang === "en-US") ||
          available[0];
        setSelectedVoiceURI(match?.voiceURI || "");
      }
    };
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const question = questions[current];

  const speak = (text, onEnd) => {
    if (!window.speechSynthesis) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.98;
    utterance.pitch = 1.02;
    const voice = voices.find((v) => v.voiceURI === selectedVoiceURI);
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setOrbState("speaking");
    utterance.onend = () => {
      setOrbState("idle");
      onEnd?.();
    };
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (!supported) {
      toast.error("Speech recognition isn't supported in this browser. Try Chrome on desktop.");
      return;
    }
    setTranscript("");
    if (mode === "classic") {
      setFeedback(null);
      setVoiceAiFeedback(null);
    }
    setOrbState("listening");
    recognitionRef.current?.start();
  };

  // ---------------- Classic Practice mode (unchanged) ----------------
  const stopAndAnalyzeClassic = () => {
    recognitionRef.current?.stop();
    setOrbState("thinking");

    setTimeout(() => {
      if (!transcript.trim()) {
        toast.error("No answer captured. Try again.");
        setOrbState("idle");
        return;
      }
      const result = analyzeAnswer(transcript, question?.answer);
      setFeedback(result);
      speak(result.spokenVerdict);
    }, 400);
  };

  const getClassicAiFeedback = async () => {
    if (!question || transcript.trim().length < 15) {
      toast.error("Give a longer answer before requesting AI feedback.");
      return;
    }
    setVoiceAiLoading(true);
    try {
      const res = await api.post("/interview-bot/voice-feedback", {
        question: question.title,
        answer: transcript,
        referenceAnswer: question.answer || undefined,
      });
      setVoiceAiFeedback(res.data);
      toast.success("AI feedback is ready.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not generate AI feedback.");
    } finally {
      setVoiceAiLoading(false);
    }
  };

  const beginSessionClassic = () => {
    setSessionStarted(true);
    const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    speak(greeting, () => {
      if (question) speak(question.title);
    });
  };

  const nextQuestion = () => {
    const next = (current + 1) % Math.max(questions.length, 1);
    setCurrent(next);
    setTranscript("");
    setFeedback(null);
    setVoiceAiFeedback(null);
    recognitionRef.current?.stop();

    const transition = TRANSITIONS[Math.floor(Math.random() * TRANSITIONS.length)];
    speak(`${transition} ${questions[next]?.title || ""}`);
  };

  const replayQuestion = () => {
    if (question) speak(question.title);
  };

  // ---------------- AI Interview Bot mode (new, additive) ----------------
  const beginSessionBot = async () => {
    setBotLoading(true);
    try {
      const res = await api.post("/interview-bot/start", { roundType, track: user?.track || null });
      setBotSession(res.data);
      setBotFeedback(null);
      setSessionStarted(true);
      const opener = res.data.transcript[res.data.transcript.length - 1]?.content;
      if (opener) speak(opener);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to start the AI interview bot.");
    } finally {
      setBotLoading(false);
    }
  };

  const stopAndRespondBot = () => {
    recognitionRef.current?.stop();
    setOrbState("thinking");

    setTimeout(async () => {
      if (!transcript.trim()) {
        toast.error("No answer captured. Try again.");
        setOrbState("idle");
        return;
      }
      try {
        const res = await api.post(`/interview-bot/${botSession.id}/respond`, { answer: transcript });
        setBotSession(res.data);
        setTranscript("");
        const followUp = res.data.transcript[res.data.transcript.length - 1]?.content;
        if (followUp) speak(followUp);
        else setOrbState("idle");
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to get a follow-up question.");
        setOrbState("idle");
      }
    }, 400);
  };

  const finishBotSession = async () => {
    if (!botSession) return;
    setBotLoading(true);
    try {
      const res = await api.post(`/interview-bot/${botSession.id}/finish`);
      setBotFeedback(res.data.feedback);
      toast.success("AI report ready!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to generate the AI report.");
    } finally {
      setBotLoading(false);
    }
  };

  const resetAll = () => {
    setSessionStarted(false);
    setTranscript("");
    setFeedback(null);
    setBotSession(null);
    setBotFeedback(null);
    setOrbState("idle");
    recognitionRef.current?.stop();
  };

  const availableRoundTypes = ROUND_TYPES.filter((r) => !r.faangOnly || user?.track === "FAANG");

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Gradient backdrop behind the hero — decorative only */}
      <div className="relative">
        <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-brand-400/10 blur-3xl" />
        <div className="relative text-center">
          <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 mb-3">
            <Sparkles size={12} className="mr-1" /> Voice-powered practice
          </span>
          <h1 className="page-title !mb-2">Voice Mock Interview</h1>
          <p className="page-subtitle !mb-8">
            A recruiter-style voice assistant that speaks questions, listens to your
            answers, and talks back with feedback — right in your browser.
          </p>
        </div>
      </div>

      {!supported && (
        <div className="card p-4 mb-6 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10 text-sm text-yellow-800 dark:text-yellow-300">
          Your browser doesn&apos;t support live speech recognition. This works best in
          Chrome or Edge on desktop. Text-to-speech will still work.
        </div>
      )}

      {/* Mode toggle — additive. "Classic Practice" is the default and behaves exactly as before. */}
      {!sessionStarted && (
        <div className="flex justify-center mb-6">
          <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-gray-800/70 gap-1">
            <button
              onClick={() => setMode("classic")}
              className={`px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-all ${
                mode === "classic"
                  ? "bg-white dark:bg-gray-900 shadow-sm text-brand-600"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <Mic2 size={14} /> Classic Practice
            </button>
            <button
              onClick={() => setMode("bot")}
              className={`px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-all ${
                mode === "bot"
                  ? "bg-white dark:bg-gray-900 shadow-sm text-brand-600"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <Bot size={14} /> AI Interview Bot
            </button>
          </div>
        </div>
      )}

      {/* AI Bot round-type selector — card-style, only shown pre-session, in bot mode */}
      {!sessionStarted && mode === "bot" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {availableRoundTypes.map((r) => {
            const Icon = r.icon;
            const active = roundType === r.value;
            return (
              <button
                key={r.value}
                onClick={() => setRoundType(r.value)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  active
                    ? "border-brand-600 bg-brand-50 dark:bg-brand-900/20"
                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                }`}
              >
                <Icon size={16} className={active ? "text-brand-600 mb-1.5" : "text-gray-400 mb-1.5"} />
                <p className="text-sm font-semibold">{r.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{r.desc}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Voice picker */}
      {voices.length > 0 && (
        <div className="flex justify-center mb-6">
          <select
            className="input-field w-64 text-xs"
            value={selectedVoiceURI}
            onChange={(e) => setSelectedVoiceURI(e.target.value)}
          >
            {voices
              .filter((v) => v.lang.startsWith("en"))
              .map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name}
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Orb + controls */}
      <div className="flex flex-col items-center gap-6 mb-8">
        <VoiceOrb state={orbState} />

        {!sessionStarted ? (
          <button
            onClick={mode === "classic" ? beginSessionClassic : beginSessionBot}
            className="btn-primary px-6 py-3"
            disabled={mode === "classic" ? !question : botLoading}
          >
            <Play size={16} /> {botLoading ? "Starting..." : "Start Mock Interview"}
          </button>
        ) : mode === "classic" ? (
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button
              onClick={orbState === "listening" ? stopAndAnalyzeClassic : startListening}
              className={orbState === "listening" ? "btn-primary bg-red-600 hover:bg-red-700" : "btn-primary"}
              disabled={orbState === "speaking" || orbState === "thinking"}
            >
              {orbState === "listening" ? "Stop & Get Feedback" : "Answer Now"}
            </button>
            <button onClick={replayQuestion} className="btn-secondary" disabled={orbState !== "idle"}>
              <RotateCcw size={16} /> Replay Question
            </button>
            <button onClick={nextQuestion} className="btn-secondary" disabled={orbState === "speaking"}>
              <SkipForward size={16} /> Next
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button
              onClick={orbState === "listening" ? stopAndRespondBot : startListening}
              className={orbState === "listening" ? "btn-primary bg-red-600 hover:bg-red-700" : "btn-primary"}
              disabled={orbState === "speaking" || orbState === "thinking" || !!botFeedback}
            >
              {orbState === "listening" ? "Stop & Continue" : "Answer Now"}
            </button>
            <button
              onClick={finishBotSession}
              className="btn-secondary"
              disabled={botLoading || orbState !== "idle" || !!botFeedback}
            >
              <Flag size={16} /> {botLoading ? "Scoring..." : "Finish & Get AI Report"}
            </button>
            <button onClick={resetAll} className="btn-secondary">
              <RotateCcw size={16} /> New Session
            </button>
          </div>
        )}
      </div>

      {/* Classic Practice question + feedback card (unchanged) */}
      {mode === "classic" && question && sessionStarted && (
        <div className="card p-6">
          <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 mb-2">
            {question.category?.replace("_", " ")}
            {question.company ? ` · ${question.company.name}` : ""}
          </span>
          <p className="font-medium text-lg mb-4">{question.title}</p>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 min-h-[70px] text-sm text-gray-600 dark:text-gray-400 mb-4">
            {transcript ||
              (orbState === "listening" ? "Listening..." : "Your spoken answer will appear here.")}
          </div>

          {feedback && (
            <div className="rounded-lg bg-brand-50 dark:bg-brand-900/20 p-4">
              <p className="font-semibold text-sm mb-2">Feedback</p>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc pl-4">
                {feedback.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 mt-2">
                Word count: {feedback.wordCount} · Filler words: {feedback.fillerCount}
                {feedback.keywordScore !== null && ` · Keyword match: ${feedback.keywordScore}%`}
              </p>
              <button onClick={getClassicAiFeedback} disabled={voiceAiLoading} className="btn-secondary mt-3 text-xs">
                <Sparkles size={14} /> {voiceAiLoading ? "Scoring your answer..." : voiceAiFeedback ? "Refresh AI Feedback" : "Get AI Feedback"}
              </button>
              {voiceAiFeedback && (
                <div className="mt-4 border-t border-brand-200 dark:border-brand-800 pt-3 space-y-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{voiceAiFeedback.report}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[["Structure", voiceAiFeedback.structure], ["Clarity", voiceAiFeedback.clarity], ["Relevance", voiceAiFeedback.relevance]].map(([label, score]) => (
                      <div key={label} className="rounded-lg bg-white/70 dark:bg-gray-900/50 p-2 text-center">
                        <p className="text-lg font-bold text-brand-600">{score}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
                      </div>
                    ))}
                  </div>
                  {voiceAiFeedback.strengths?.length > 0 && <div><p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">What worked</p><ul className="text-sm text-gray-600 dark:text-gray-400 list-disc pl-4 space-y-1">{voiceAiFeedback.strengths.map((item, i) => <li key={i}>{item}</li>)}</ul></div>}
                  {voiceAiFeedback.improvements?.length > 0 && <div><p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Try next time</p><ul className="text-sm text-gray-600 dark:text-gray-400 list-disc pl-4 space-y-1">{voiceAiFeedback.improvements.map((item, i) => <li key={i}>{item}</li>)}</ul></div>}
                </div>
              )}
              {question.answer && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Ideal answer: </span>
                  {question.answer}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* AI Interview Bot conversation + report (new, additive) */}
      {mode === "bot" && sessionStarted && botSession && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
              {ROUND_TYPES.find((r) => r.value === roundType)?.label} Round
            </span>
            {user?.track && (
              <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {user.track.replace("_", " ")}
              </span>
            )}
          </div>

          <div className="space-y-3 mb-4 max-h-80 overflow-y-auto pr-1">
            {botSession.transcript.map((t, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 ${t.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                    t.role === "assistant"
                      ? "bg-brand-100 dark:bg-brand-900/40 text-brand-600"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {t.role === "assistant" ? <Bot size={14} /> : <User size={14} />}
                </div>
                <div
                  className={`text-sm px-3.5 py-2.5 rounded-2xl max-w-[80%] ${
                    t.role === "assistant"
                      ? "bg-gray-50 dark:bg-gray-800/70 text-gray-800 dark:text-gray-200 rounded-tl-sm"
                      : "bg-brand-600 text-white rounded-tr-sm"
                  }`}
                >
                  {t.content}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 min-h-[60px] text-sm text-gray-600 dark:text-gray-400">
            {transcript ||
              (orbState === "listening" ? "Listening..." : "Your spoken answer will appear here.")}
          </div>

          {botFeedback && (
            <div className="rounded-xl bg-gradient-to-br from-brand-50 to-white dark:from-brand-900/20 dark:to-gray-900 p-5 mt-4 border border-brand-100 dark:border-brand-900/40">
              <p className="font-semibold text-sm mb-4 flex items-center gap-1.5">
                <Sparkles size={14} className="text-brand-600" /> AI Interview Report
              </p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Clarity", value: botFeedback.clarity },
                  { label: "Technical Accuracy", value: botFeedback.technicalAccuracy },
                  { label: "Pacing", value: botFeedback.pacing },
                ].map((m) => (
                  <div key={m.label} className="text-center bg-white dark:bg-gray-900 rounded-lg p-3">
                    <p className="text-2xl font-bold text-brand-600">{m.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{botFeedback.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
