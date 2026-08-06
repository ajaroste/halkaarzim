import type { Ipo } from "@/data/ipos";

export function EventTimeline({ events }: { events: Ipo["agenda"] }) {
  return <div className="timeline">{events.map((event) => (
    <article className="timelineItem" key={`${event.date}-${event.title}`}>
      <div className={`timelineDot ${event.impact}`} aria-hidden="true" />
      <div className="timelineContent"><div className="timelineMeta"><span>{event.date}</span><span>{event.category}</span><span>{event.source}</span></div><h3>{event.title}</h3><p>{event.summary}</p></div>
    </article>
  ))}</div>;
}
