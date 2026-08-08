import type { CSSProperties } from "react";

function coverageLevel(score: number): string {
  if (score >= 85) return "Veri kapsamı yüksek";
  if (score >= 65) return "Veri kapsamı yeterli";
  if (score >= 40) return "Veri kapsamı sınırlı";
  return "Veri kapsamı düşük";
}

export function AiScore({ score, compact = false }: { score: number; compact?: boolean }) {
  return (
    <div className={compact ? "score compact" : "score"} aria-label={`Veri ve arz yapısı skoru ${score}`}>
      <div className="scoreRing" style={{ "--score": score } as CSSProperties}><strong>{score}</strong><span>/100</span></div>
      {!compact && <div><span className="eyebrow">Veri ve Arz Yapısı Skoru</span><strong className="scoreLevel">{coverageLevel(score)}</strong></div>}
    </div>
  );
}
