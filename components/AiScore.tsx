import type { CSSProperties } from "react";
import { scoreLevel } from "@/lib/domain";

export function AiScore({ score, compact = false }: { score: number; compact?: boolean }) {
  return (
    <div className={compact ? "score compact" : "score"} aria-label={`Arz puanı ${score}`}>
      <div className="scoreRing" style={{ "--score": score } as CSSProperties}><strong>{score}</strong><span>/100</span></div>
      {!compact && <div><span className="eyebrow">Arz puanı</span><strong className="scoreLevel">{scoreLevel(score)}</strong></div>}
    </div>
  );
}
