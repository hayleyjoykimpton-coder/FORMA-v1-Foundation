"use client";

import { ConnectFacebookCta } from "@/components/cracker/ConnectFacebookCta";
import {
  CONNECT_COPY,
  CONNECT_EVENT_FORMATS,
  CONNECT_EVENT_WEEKS,
  CONNECT_MORE_WAYS,
} from "@/lib/connect";

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
        <div className="connect-week-stack">
          {CONNECT_EVENT_WEEKS.map((item) => (
            <article key={item.week} className="card nourish-hub-card connect-week-card">
              <p className="eyebrow">WEEK {item.week}</p>
              <h2>{item.theme}</h2>
              <p className="muted">{item.summary}</p>
              <ConnectFacebookCta label={CONNECT_COPY.eventDetailsCta} secondary />
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
