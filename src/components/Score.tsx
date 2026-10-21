interface Props { label: string; value: number; accent?: string }
export function Score({ label, value, accent = "#96a4ba" }: Props) {
  return (
    <div className="score" aria-label={`${label} ${value}${label === "Confidence" ? "%" : ""}`}>
      <span className="score__ring" style={{ background: `conic-gradient(${accent} ${value * 3.6}deg, rgba(148,163,184,.16) 0)` }}><i /></span>
      <span><small>{label}</small><strong>{value}{label === "Confidence" ? "%" : ""}</strong></span>
    </div>
  );
}
