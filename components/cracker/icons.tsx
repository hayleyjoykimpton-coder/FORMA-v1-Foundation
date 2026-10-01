"use client";

/** External-link glyph for NOURISH / CONNECT CTAs. */
export function ExternalLinkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6.5 3.5H4.2A1.7 1.7 0 0 0 2.5 5.2v6.6A1.7 1.7 0 0 0 4.2 13.5h6.6a1.7 1.7 0 0 0 1.7-1.7V9.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M9.5 2.5H13.5V6.5M7.5 8.5L13.2 2.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconHome({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconMove({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13 3v7h7M11 21v-7H4"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 3l7 7M10 21l-7-7"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconNourish({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.6-7 10-7 10z"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconConnect({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="8" cy="9" r="3" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} />
      <circle cx="16" cy="9" r="3" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} />
      <path
        d="M3.5 19c.8-2.6 2.9-4 5.5-4s4.7 1.4 5.5 4M13 15c1.1-.6 2.4-1 3.8-1 2.6 0 4.7 1.4 5.5 4"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconHelpMail() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconHelpTraining() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 10h18M7 10v4M17 10v4M5 14h2M17 14h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9 8V6h6v2" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

export function IconHelpNourish() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.6-7 10-7 10z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconHelpCommunity() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 19c.7-2.4 2.6-4 5-4s4.3 1.6 5 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="16.5" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
