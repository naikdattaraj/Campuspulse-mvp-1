type Props = { value: number; max?: number; size?: number; label?: string; color?: string; unit?: string };

export default function ScoreRing({ value, max = 100, size = 84, label, color = "var(--primary)", unit = "" }: Props) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={label ?? `${value} out of ${max}`}
    >
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="10" />
      <circle
        cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 50 50)"
      />
      <text x="50" y="57" textAnchor="middle" fontSize="24" className="ring-text">
        {value}{unit}
      </text>
    </svg>
  );
}
