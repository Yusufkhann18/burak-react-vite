import { useCallback, useEffect, useRef, useState } from "react";

const events = [
  {
    title: "Hot Discount Days",
    description: "Every Friday, enjoy our biggest discounts.",
    author: "Chef Deming",
    date: "30 min ago",
    location: "Istanbul, Türkiye",
    image: "/img/discount.webp",
  },
  {
    title: "Coming Soon",
    description: "Get ready for new arrivals on Monday.",
    author: "Belissimo Arthur",
    date: "2 days ago",
    location: "Istanbul, Türkiye",
    image: "/img/fresh.webp",
  },
  {
    title: "New Project Launch",
    description: "A new restaurant is opening in Florida.",
    author: "Morgan News",
    date: "5 days ago",
    location: "Florida, USA",
    image: "/img/coming.webp",
  },
  {
    title: "Join Us on Social Media",
    description: "Find healthy recipes on our social channels.",
    author: "Belissimo Agent",
    date: "A week ago",
    location: "France",
    image: "/img/food-city.webp",
  },
];
const reducedMotion = "(prefers-reduced-motion: reduce)";

export default function Events() {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [rotating, setRotating] = useState(
    () => window.matchMedia?.(reducedMotion).matches === false,
  );

  const showEvent = useCallback((index: number) => {
    const next = (index + events.length) % events.length;
    const container = track.current;
    const element = container?.children[next];
    if (element instanceof HTMLElement) {
      container?.scrollTo?.({
        left: element.offsetLeft,
        behavior: window.matchMedia?.(reducedMotion).matches ? "auto" : "smooth",
      });
    }
    setActive(next);
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) showEvent(active + 1);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [active, rotating, showEvent]);

  function selectEvent(index: number) {
    setRotating(false);
    showEvent(index);
  }

  return (
    <section className="home-events" aria-labelledby="events-title">
      <h2 id="events-title" className="home-section-title">
        Events
      </h2>
      <div
        className="events-track"
        ref={track}
        onPointerDown={() => setRotating(false)}
        onWheel={() => setRotating(false)}
        onScroll={() => {
          const el = track.current;
          const second = el?.children[1];
          if (el && second instanceof HTMLElement && second.offsetLeft > 0) {
            setActive(Math.min(events.length - 1, Math.round(el.scrollLeft / second.offsetLeft)));
          }
        }}
      >
        {events.map((event, index) => (
          <article className="event-card" key={event.title} aria-labelledby={`event-title-${index}`}>
            <img
              className="event-photo"
              src={event.image}
              alt=""
              loading="lazy"
            />
            <div className="event-detail">
              <div className="event-heading">
                <h3 id={`event-title-${index}`}>{event.title}</h3>
                <span>
                  <img src="/icons/speaker.svg" alt="" />
                  {event.author}
                </span>
              </div>
              <p>{event.description}</p>
              <div className="event-meta">
                <span>
                  <img src="/icons/calendar.svg" alt="" />
                  {event.date}
                </span>
                <span>
                  <img src="/icons/location.svg" alt="" />
                  {event.location}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="events-controls" aria-label="Event navigation">
        <button type="button" onClick={() => selectEvent(active - 1)} aria-label="Previous event">
          ←
        </button>
        {events.map((event, index) => (
          <button
            className="event-dot"
            key={event.title}
            type="button"
            aria-label={`Show ${event.title}`}
            aria-current={active === index ? "true" : undefined}
            onClick={() => selectEvent(index)}
          />
        ))}
        <button type="button" onClick={() => selectEvent(active + 1)} aria-label="Next event">
          →
        </button>
        <button
          type="button"
          aria-label={rotating ? "Pause event rotation" : "Play event rotation"}
          onClick={() => setRotating((current) => !current)}
        >
          <span aria-hidden="true">{rotating ? "Ⅱ" : "▸"}</span>
        </button>
      </div>
    </section>
  );
}
