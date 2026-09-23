"use client";

import { ConnectFacebookCta } from "@/components/cracker/ConnectFacebookCta";
import { ExternalLinkIcon } from "@/components/cracker/icons";
import {
  CRACKER_FACEBOOK_URL,
  type ConnectEvent,
  type ConnectEventAction,
} from "@/lib/connect";
import { configuredUrl, tygPaydayBookingUrl } from "@/lib/crackerLinks";

export function EventCard({ event }: { event: ConnectEvent }) {
  return (
    <article className="event-card">
      <p className="event-week">{event.week}</p>
      <h2 className="event-title">{event.title}</h2>
      <p className="event-description">{event.description}</p>
      <div className="event-action">
        <EventActionButton event={event} />
      </div>
    </article>
  );
}

function EventActionButton({ event }: { event: ConnectEvent }) {
  const action = resolveEventAction(event);
  if (!action) return null;

  if (action.type === "facebook" || action.url === CRACKER_FACEBOOK_URL) {
    return <ConnectFacebookCta label={action.label} />;
  }

  if (!action.url) {
    return (
      <button type="button" className="secondary-btn" disabled>
        COMING SOON
      </button>
    );
  }

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
  if (event.id === 3) {
    return { ...event.action, url: tygPaydayBookingUrl() ?? "" };
  }
  if (event.action.type === "facebook") {
    return { ...event.action, url: configuredUrl(event.action.url) ?? CRACKER_FACEBOOK_URL };
  }
  return { ...event.action, url: configuredUrl(event.action.url) ?? "" };
}
