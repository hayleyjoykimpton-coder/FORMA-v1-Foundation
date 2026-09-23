"use client";

import { ConnectFacebookCta } from "@/components/cracker/ConnectFacebookCta";
import { ExternalLinkIcon } from "@/components/cracker/icons";
import {
  CONNECT_COPY,
  CONNECT_EVENT_FORMATS,
  CONNECT_EVENTS,
  CONNECT_MORE_WAYS,
  CRACKER_FACEBOOK_URL,
  type ConnectEvent,
  type ConnectEventAction,
} from "@/lib/connect";
import { configuredUrl, tygPaydayBookingUrl } from "@/lib/crackerLinks";

export function ConnectEvents() {
  return (
    <div className="connect-panel">
      <p className="muted">{CONNECT_COPY.eventsNote}</p>
      <ConnectFacebookCta label={CONNECT_COPY.eventsCta} />

      <article className="card nourish-hub-card">
        <p className="eyebrow">EVENT FORMATS</p>
        <div className="connect-format-pills">
          {CONNECT_EVENT_FORMATS.map((format) => (
            <span key={format} className="connect-format-pill">
              {format}
            </span>
          ))}
        </div>
        <p className="muted">{CONNECT_COPY.eventFormatsNote}</p>
      </article>

      <section aria-label="Six-week event line-up">
        <p className="eyebrow">SIX-WEEK LINE-UP</p>
        <div className="connect-week-stack events-list">
          {CONNECT_EVENTS.map((item) => (
            <article key={item.id} className="card nourish-hub-card connect-week-card event-card">
              <p className="eyebrow event-week">{item.week}</p>
              <h2 className="event-title">{item.title}</h2>
              <p className="muted event-description">{item.description}</p>
              <div className="event-action">
                <EventActionButton event={item} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="More ways to connect">
        <p className="eyebrow">{CONNECT_COPY.moreWaysTitle}</p>
        <div className="connect-more-grid">
          {CONNECT_MORE_WAYS.map((item) => (
            <article key={item.title} className="card nourish-hub-card">
              <h2>{item.title}</h2>
              <p className="muted">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <article className="card nourish-hub-card">
        <p className="eyebrow">{CONNECT_COPY.partyEyebrow}</p>
        <h2>{CONNECT_COPY.partyTitle}</h2>
        <p className="nourish-price connect-party-date">{CONNECT_COPY.partyDate}</p>
        <p className="muted">{CONNECT_COPY.partyBody}</p>
        <ConnectFacebookCta label={CONNECT_COPY.partyCta} />
      </article>

      <p className="muted connect-live-note">{CONNECT_COPY.facebookLiveFooter}</p>
      <ConnectFacebookCta label={CONNECT_COPY.viewEventDetailsCta} secondary />
    </div>
  );
}

function EventActionButton({ event }: { event: ConnectEvent }) {
  const action = resolveEventAction(event);
  if (!action) return null;

  if (action.type === "facebook" || action.url === CRACKER_FACEBOOK_URL) {
    return <ConnectFacebookCta label={action.label} secondary />;
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
      <a className="secondary-btn cracker-external-cta" href={action.url}>
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
    return {
      ...event.action,
      url: tygPaydayBookingUrl() ?? "",
    };
  }
  if (event.action.type === "facebook") {
    return {
      ...event.action,
      url: configuredUrl(event.action.url) ?? CRACKER_FACEBOOK_URL,
    };
  }
  return {
    ...event.action,
    url: configuredUrl(event.action.url) ?? "",
  };
}
