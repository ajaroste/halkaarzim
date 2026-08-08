"use client";

import { useEffect, useState } from "react";
import { AiScore } from "./AiScore";

type Analysis = {
  provider?: string;
  model?: string;
  score?: number;
  summary?: string;
  strengths?: string[];
  risks?: string[];
  dataGaps?: string[];
};

export function AiRuntimeAnalysis({
  slug,
  fallbackScore,
  fallbackSummary,
  fallbackHighlights,
  fallbackRisks
}: {
  slug: string;
  fallbackScore: number;
  fallbackSummary: string;
  fallbackHighlights: string[];
  fallbackRisks: string[];
}) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/ai/ipo/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    })
      .then(async (response) => response.ok ? response.json() as Promise<Analysis> : null)
      .then((result) => {
        if (result?.provider === "google-gemini") setAnalysis(result);
      })
      .catch(() => null);
    return () => controller.abort();
  }, [slug]);

  const score = Number.isFinite(Number(analysis?.score)) ? Number(analysis?.score) : fallbackScore;
  const summary = analysis?.summary || fallbackSummary;
  const highlights = Array.isArray(analysis?.strengths) && analysis.strengths.length ? analysis.strengths : fallbackHighlights;
  const riskItems = [
    ...(Array.isArray(analysis?.risks) ? analysis.risks : fallbackRisks),
    ...(Array.isArray(analysis?.dataGaps) ? analysis.dataGaps : [])
  ].filter(Boolean);
  const isGemini = analysis?.provider === "google-gemini";

  return <>
    <div className="reportLead">
      <AiScore score={score} />
      <div>
        <strong className="reportLabel">{isGemini ? "Gemini ile AI analizi" : "Kaynak bazlı ön analiz"}</strong>
        {isGemini && <small className="aiProviderStamp">Gemini · kaynaklara dayalı</small>}
        <p>{summary}</p>
      </div>
    </div>
    {(highlights.length > 0 || riskItems.length > 0) && <div className="summarySplit">
      {highlights.length > 0 && <div className="summaryList positiveSummary"><h3>Olumlu unsurlar</h3><ul>{highlights.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul></div>}
      {riskItems.length > 0 && <div className="summaryList riskSummary"><h3>Riskler ve eksik bilgiler</h3><ul>{riskItems.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul></div>}
    </div>}
  </>;
}
