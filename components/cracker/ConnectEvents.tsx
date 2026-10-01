"use client";

import { ConnectFacebookCta } from "@/components/cracker/ConnectFacebookCta";
import { EventCard } from "@/components/cracker/EventCard";
import { CONNECT_COPY, CONNECT_EVENTS } from "@/lib/connect";

export function ConnectEvents() {
  return (
    <div className="content-container connect-panel">
      <p className="muted">{CONNECT_COPY.eventsNote}</p>

      <section className="events-list" aria-label="Weekly CRACKER events">
        {CONNECT_EVENTS.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </section>

      <article className="event-card">
        <p className="event-week">{CONNECT_COPY.partyEyebrow}</p>
        <h2 className="event-title">{CONNECT_COPY.partyTitle}</h2>
        <p className="event-description">
          {CONNECT_COPY.partyDate}. {CONNECT_COPY.partyBody}
        </p>
        <div className="event-action">
          <ConnectFacebookCta label={CONNECT_COPY.partyCta} />
        </div>
      </article>
    </div>
  );
}
