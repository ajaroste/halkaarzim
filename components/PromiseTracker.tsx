import type { Ipo } from "@/data/ipos";

const labels = { completed: "Tamamlandı", "in-progress": "Devam ediyor", "not-started": "Başlamadı" } as const;
export function PromiseTracker({ promises }: { promises: Ipo["promises"] }) {
  return <div className="promiseList">{promises.map((promise) => <article key={promise.title} className="promiseRow"><span className={`promiseStatus ${promise.status}`}>{labels[promise.status]}</span><div><strong>{promise.title}</strong><p>{promise.note}</p></div></article>)}</div>;
}
