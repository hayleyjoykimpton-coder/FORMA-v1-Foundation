"use client";

import { useState } from "react";
import { CONNECT_INCLUDED, type IncludeFlag } from "@/lib/connect";

export function ConnectIncluded() {
  const [open, setOpen] = useState<string>("move");

  return (
    <div className="connect-panel connect-included-stack">
      {CONNECT_INCLUDED.map((category) => {
        const expanded = open === category.key;
        return (
          <article
            key={category.key}
            className={`card nourish-hub-card connect-include-card${expanded ? " is-open" : ""}`}
          >
            <button
              type="button"
              className="connect-include-toggle"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? "" : category.key)}
            >
              <span>
                <strong>{category.title}</strong>
                <small>{category.preview}</small>
              </span>
              <span className="connect-include-chevron" aria-hidden="true">
                {expanded ? "–" : "+"}
              </span>
            </button>
            {expanded ? (
              <ul className="connect-include-list">
                {category.items.map((item) => (
                  <li key={item.text}>
                    <span>{item.text}</span>
                    {item.flag ? <IncludeBadge flag={item.flag} /> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function IncludeBadge({ flag }: { flag: IncludeFlag }) {
  return (
    <em className={`connect-include-flag is-${flag}`}>
      {flag === "optional" ? "OPTIONAL" : "LOCATION DEPENDENT"}
    </em>
  );
}
