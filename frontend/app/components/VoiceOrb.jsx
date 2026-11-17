"use client";

// A Siri-style pulsing orb that visually reflects the assistant's state:
// idle (gentle breathing), speaking (rippling outward), listening (reactive bars).
export default function VoiceOrb({ state = "idle", size = 160 }) {
  const stateClasses = {
    idle: "animate-[pulse_3s_ease-in-out_infinite]",
    speaking: "animate-[pulse_1s_ease-in-out_infinite]",
    listening: "animate-[pulse_0.6s_ease-in-out_infinite]",
    thinking: "animate-spin-slow",
  };

  const ringColors = {
    idle: "from-brand-400 to-brand-600",
    speaking: "from-purple-400 to-brand-600",
    listening: "from-red-400 to-orange-500",
    thinking: "from-brand-400 to-purple-500",
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer ripple rings — only animate while listening/speaking */}
      {(state === "listening" || state === "speaking") && (
        <>
          <span
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${ringColors[state]} opacity-20 animate-ping`}
          />
          <span
            className={`absolute inset-3 rounded-full bg-gradient-to-br ${ringColors[state]} opacity-30 animate-ping [animation-delay:150ms]`}
          />
        </>
      )}

      {/* Core orb */}
      <div
        className={`relative rounded-full bg-gradient-to-br ${ringColors[state]} shadow-lg shadow-brand-500/30 ${stateClasses[state]} flex items-center justify-center`}
        style={{ width: size * 0.65, height: size * 0.65 }}
      >
        <div className="rounded-full bg-white/20 backdrop-blur-sm w-full h-full flex items-center justify-center">
          {state === "listening" && <VoiceBars />}
          {state === "speaking" && <SpeakingWave />}
          {state === "idle" && <span className="text-white text-2xl">🎤</span>}
          {state === "thinking" && <span className="text-white text-2xl">💭</span>}
        </div>
      </div>
    </div>
  );
}

function VoiceBars() {
  const bars = [0, 1, 2, 3, 4];
  return (
    <div className="flex items-end gap-1 h-8">
      {bars.map((i) => (
        <span
          key={i}
          className="w-1.5 bg-white rounded-full animate-[bounce_0.8s_ease-in-out_infinite]"
          style={{ height: "100%", animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

function SpeakingWave() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 bg-white rounded-full animate-[bounce_1s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
