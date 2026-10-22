interface Props { label: string; value: number; accent?: string }

export function Score({ label, value, accent = "#96a4ba" }: Props) {
  const boundedValue = Math.max(0, Math.min(100, value));
  const isPercent = label === "Confidence";
  return (
    <div className="score" aria-label={`${label} ${boundedValue}${isPercent ? "%" : ""}`}>
      <span
        className="score__ring"
        role="img"
        aria-label={`${boundedValue} out of 100`}
        style={{ background: `conic-gradient(${accent} ${boundedValue * 3.6}deg, rgba(148,163,184,.16) 0)` }}
      ><i /></span>
      <span><small>{label}</small><strong>{boundedValue}{isPercent ? "%" : ""}</strong></span>
    </div>
  );
}
