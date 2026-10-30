import { useRef, useState } from "react";
const events = ["event-seafood", "event-discount", "event-cutlet", "event-kebab"];
export default function Events() {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  function showEvent(index: number) {
    const next = (index + events.length) % events.length;
    const element = track.current?.children[next] as HTMLElement | undefined;
    if (track.current && element)
      track.current.scrollTo({
        left: element.offsetLeft - track.current.offsetLeft,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    setActive(next);
  }
  return (
    <section className="home-events" aria-labelledby="events-title">
      <h2 id="events-title" className="home-section-title">
        Events
      </h2>
      <div
        className="events-track"
        ref={track}
        onScroll={() => {
          const el = track.current;
          if (el) {
            const width = (el.firstElementChild as HTMLElement)?.offsetWidth + 30;
            setActive(Math.min(events.length - 1, Math.round(el.scrollLeft / width)));
          }
        }}
      >
        {events.map((image, index) => (
          <article className="event-card" key={image} aria-label={`Event ${index + 1}`}>
            <img
              className="event-photo"
              src={`/img/home/${image}.webp`}
              alt="Turkish dishes at Burak"
              loading="lazy"
            />
            <div className="event-detail">
              <div className="event-heading">
                <h3>Hot Discount Days</h3>
                <span>
                  <img src="/icons/speaker.svg" alt="" />
                  Chef Deming
                </span>
              </div>
              <p>Each Friday we deliver highest discoutns</p>
              <div className="event-meta">
                <span>
                  <img src="/icons/calendar.svg" alt="" />
                  30 min ago
                </span>
                <span>
                  <img src="/icons/location.svg" alt="" />
                  Turkey, Instabul
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="events-controls" aria-label="Event navigation">
        <button type="button" onClick={() => showEvent(active - 1)} aria-label="Previous event">
          ←
        </button>
        {events.map((event, index) => (
          <button
            className="event-dot"
            key={event}
            type="button"
            aria-label={`Show event ${index + 1}`}
            aria-current={active === index ? "true" : undefined}
            onClick={() => showEvent(index)}
          />
        ))}
        <button type="button" onClick={() => showEvent(active + 1)} aria-label="Next event">
          →
        </button>
      </div>
    </section>
  );
}
