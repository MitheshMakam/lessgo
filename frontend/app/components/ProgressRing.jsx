export default function ProgressRing({ percent, size = 72, stroke = 7, label }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-gray-200 dark:stroke-gray-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="stroke-brand-600 transition-all duration-500"
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-gray-800 dark:fill-gray-100 font-semibold text-sm rotate-90"
          style={{ transform: "rotate(90deg)", transformOrigin: "center" }}
        >
          {percent}%
        </text>
      </svg>
      {label && <span className="text-xs text-gray-500 dark:text-gray-400 text-center">{label}</span>}
    </div>
  );
}
