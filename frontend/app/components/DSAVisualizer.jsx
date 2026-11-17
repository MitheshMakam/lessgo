"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";

export default function DSAVisualizer({ steps }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef(null);

  const step = steps[index];

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setIndex((i) => {
          if (i >= steps.length - 1) {
            setPlaying(false);
            return i;
          }
          return i + 1;
        });
      }, 1400);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, steps.length]);

  if (!step) return null;

  const isString = typeof step.array[0] === "string" && isNaN(Number(step.array[0]));

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-900/50">
      {/* Array / stack visualization */}
      <div className="flex items-end justify-center gap-2 min-h-[90px] flex-wrap py-4">
        {step.array.length === 0 && (
          <span className="text-xs text-gray-400 italic">empty</span>
        )}
        {step.array.map((val, i) => {
          const isHighlighted = step.highlights?.includes(i);
          const pointerLabels = (step.pointers || []).filter((p) => p.index === i).map((p) => p.label);
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={`flex items-center justify-center rounded-lg border-2 font-mono text-sm font-semibold transition-all duration-300 ${
                  isString ? "px-3 h-10 min-w-[3rem]" : "h-10 w-10"
                } ${
                  isHighlighted
                    ? "border-brand-600 bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 scale-110"
                    : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {val}
              </div>
              {pointerLabels.length > 0 && (
                <span className="text-[10px] font-medium text-brand-600 bg-brand-50 dark:bg-brand-900/30 px-1.5 rounded">
                  {pointerLabels.join(", ")}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Step description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center min-h-[40px] px-2">
        {step.description}
      </p>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <button
          onClick={() => {
            setPlaying(false);
            setIndex(0);
          }}
          className="btn-secondary px-2 py-1.5"
          aria-label="Restart"
        >
          <RotateCcw size={14} />
        </button>
        <button
          onClick={() => {
            setPlaying(false);
            setIndex((i) => Math.max(0, i - 1));
          }}
          disabled={index === 0}
          className="btn-secondary px-2 py-1.5"
          aria-label="Previous step"
        >
          <SkipBack size={14} />
        </button>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="btn-primary px-4 py-1.5"
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? "Pause" : "Play"}
        </button>
        <button
          onClick={() => {
            setPlaying(false);
            setIndex((i) => Math.min(steps.length - 1, i + 1));
          }}
          disabled={index === steps.length - 1}
          className="btn-secondary px-2 py-1.5"
          aria-label="Next step"
        >
          <SkipForward size={14} />
        </button>
        <span className="text-xs text-gray-400 ml-2">
          Step {index + 1} / {steps.length}
        </span>
      </div>
    </div>
  );
}
