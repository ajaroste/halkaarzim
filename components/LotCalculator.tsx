"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { estimateLots, formatTry } from "@/lib/domain";

export function LotCalculator({ price, retailLots }: { price: number; retailLots: number }) {
  const [budget, setBudget] = useState(5000);
  const [participants, setParticipants] = useState(1500000);
  const result = useMemo(() => estimateLots({ budget, price, estimatedParticipants: participants, retailLots }), [budget, price, participants, retailLots]);
  return (
    <div className="calculator">
      <label>Katılım bütçen<input type="number" min="0" step="100" value={budget} onChange={(e: ChangeEvent<HTMLInputElement>) => setBudget(Number(e.target.value))} /></label>
      <label>Tahmini bireysel katılımcı<input type="number" min="1" step="10000" value={participants} onChange={(e: ChangeEvent<HTMLInputElement>) => setParticipants(Number(e.target.value))} /></label>
      <div className="calculatorResult"><span>Tahmini dağıtım</span><strong>{result.estimatedLots} lot</strong><small>Yaklaşık maliyet: {formatTry(result.estimatedCost)}</small></div>
      <p>Bu hesap yalnızca eşit dağıtım için yaklaşık senaryodur. Gerçek dağıtım katılımcı sayısı, tahsisat ve taleplere göre değişir.</p>
    </div>
  );
}
