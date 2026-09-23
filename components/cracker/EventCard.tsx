"use client";

import { ExternalLinkIcon } from "@/components/cracker/icons";
import { type ConnectEvent, type ConnectEventAction } from "@/lib/connect";
import { configuredUrl, tygPaydayBookingUrl } from "@/lib/crackerLinks";

export function EventCard({ event }: { event: ConnectEvent }) {
  const action = resolveEventAction(event);

  return (
    <article className="event-card">
      <p className="event-week">{event.week}</p>
      <h2 className="event-title">{event.title}</h2>
      <p className="event-description">{event.description}</p>
      {action ? (
        <div className="event-action">
          <EventActionButton action={action} />
        </div>
      ) : null}
    </article>
  );
}

function EventActionButton({ action }: { action: ConnectEventAction }) {
  if (action.type === "internal") {
    return (
      <a className="cta-btn cracker-external-cta" href={action.url}>
        <span>{action.label}</span>
      </a>
    );
  }

  return (
    <a
      className="cta-btn cracker-external-cta"
      href={action.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>{action.label}</span>
      <ExternalLinkIcon size={16} />
    </a>
  );
}

function resolveEventAction(event: ConnectEvent): ConnectEventAction | null {
  if (!event.action) return null;
  const url =
    event.id === 3 ? tygPaydayBookingUrl() : configuredUrl(event.action.url);
  if (!url) return null;
  return { ...event.action, url };
}
