"use client";

import { useEffect, useState } from "react";
import { AiScore } from "./AiScore";

type Analysis = {
  provider?: string;
  model?: string;
  score?: number;
  confidence?: number;
  summary?: string;
  strengths?: string[];
  risks?: string[];
  dataGaps?: string[];
};

function AiSparkIcon() {
  return <svg className="aiSparkIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.75c.55 3.35 2.24 5.04 5.6 5.6-3.36.55-5.05 2.24-5.6 5.6-.56-3.36-2.25-5.05-5.6-5.6 3.35-.56 5.04-2.25 5.6-5.6ZM18.1 14.2c.3 1.8 1.2 2.7 3 3-1.8.3-2.7 1.2-3 3-.3-1.8-1.2-2.7-3-3 1.8-.3 2.7-1.2 3-3ZM5.4 14.8c.22 1.3.87 1.95 2.17 2.17-1.3.22-1.95.87-2.17 2.17-.22-1.3-.87-1.95-2.17-2.17 1.3-.22 1.95-.87 2.17-2.17Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>;
}

function validAnalysis(value: unknown): value is Analysis {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Analysis;
  return candidate.provider === "google-gemini" && typeof candidate.summary === "string" && candidate.summary.trim().length > 0;
}

export function AiRuntimeAnalysis({
  slug,
  fallbackScore
}: {
  slug: string;
  fallbackScore: number;
  fallbackSummary: string;
  fallbackHighlights: string[];
  fallbackRisks: string[];
}) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const storageKey = `halkaarzim:ai:${slug}`;
    let restored = false;

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as unknown;
        if (validAnalysis(saved)) {
          setAnalysis(saved);
          restored = true;
        }
      }
    } catch {
      // Local cache is best-effort only.
    }

    setFinished(false);

    void fetch(`/api/ai/ipo/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    })
      .then(async (response) => response.ok ? response.json() as Promise<Analysis> : null)
      .then((result) => {
        if (!validAnalysis(result)) return;
        setAnalysis(result);
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(result));
        } catch {
          // Rendering must not depend on localStorage availability.
        }
      })
      .catch(() => null)
      .finally(() => setFinished(true));

    if (restored) setFinished(true);
    return () => controller.abort();
  }, [slug]);

  const isGemini = analysis?.provider === "google-gemini" && Boolean(analysis.summary);
  const scoreCandidate = Number(analysis?.confidence ?? analysis?.score);
  const score = Number.isFinite(scoreCandidate) ? scoreCandidate : fallbackScore;
  const highlights = isGemini && Array.isArray(analysis?.strengths) ? analysis.strengths.filter(Boolean).slice(0, 4) : [];
  const riskItems = isGemini ? [
    ...(Array.isArray(analysis?.risks) ? analysis.risks : []),
    ...(Array.isArray(analysis?.dataGaps) ? analysis.dataGaps : [])
  ].filter(Boolean).slice(0, 6) : [];

  return <>
    <div className="reportLead">
      <AiScore score={score} />
      <div>
        <div className="aiReportTitleRow"><span className="aiReportIcon"><AiSparkIcon /></span><strong className="reportLabel">{isGemini ? "HalkaArz AI yorumu" : finished ? "HalkaArz AI yorumu kullanılamıyor" : "HalkaArz AI hazırlanıyor"}</strong></div>
        <small className="aiProviderStamp">{isGemini ? "Gemini altyapısı · doğrulanmış kaynaklara dayalı" : finished ? "AI yanıtı henüz hazır değil. Sistem daha sonra yeniden deneyecek." : "Doğrulanmış halka arz verileri analiz ediliyor"}</small>
        <p>{isGemini ? analysis?.summary : finished ? "Bu halka arz için kayıtlı AI yorumu henüz bulunmuyor." : "Halka arz verileri HalkaArz AI tarafından değerlendiriliyor."}</p>
      </div>
    </div>
    {isGemini && (highlights.length > 0 || riskItems.length > 0) && <div className="summarySplit">
      {highlights.length > 0 && <div className="summaryList positiveSummary"><h3>Verilerde öne çıkanlar</h3><ul>{highlights.map((item) => <li key={item}>{item}</li>)}</ul></div>}
      {riskItems.length > 0 && <div className="summaryList riskSummary"><h3>Riskler ve eksik bilgiler</h3><ul>{riskItems.map((item) => <li key={item}>{item}</li>)}</ul></div>}
    </div>}
  </>;
}
