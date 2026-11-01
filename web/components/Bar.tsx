export default function Bar({ pct, kind }: { pct: number; kind?: "good" | "xp" }) {
  return (
    <div className={`bar ${kind ?? ""}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}
