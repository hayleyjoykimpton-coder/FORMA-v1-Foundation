/**
 * Single source of truth for Christmas Cracker 2026 challenge milestones.
 * Import from here — do not hardcode dates in multiple components.
 */

export type ChallengeMilestone = {
  id: string;
  label: string;
  dateLabel: string;
  /** Compact timeline date, e.g. "12 OCT". */
  dateShort: string;
  /** Compact timeline label. */
  timelineLabel: string;
  /** Optional grouping kicker, e.g. SCANS. */
  kicker?: string;
  /** Inclusive local start (YYYY-MM-DD) for next-up logic. */
  startISO: string;
  /** Inclusive local end (YYYY-MM-DD). */
  endISO: string;
  /** Optional supporting note shown under the date. */
  note?: string;
};

export const CRACKER_CHALLENGE_MILESTONES: ChallengeMilestone[] = [
  {
    id: "registration_close",
    label: "Official Registration Close",
    dateLabel: "12 October 2026",
    dateShort: "12 OCT",
    timelineLabel: "REG CLOSE",
    startISO: "2026-10-12",
    endISO: "2026-10-12",
  },
  {
    id: "pre_challenge_scans",
    label: "Pre-Challenge Scans",
    dateLabel: "5–12 October 2026",
    dateShort: "5–12 OCT",
    timelineLabel: "Pre-Challenge",
    kicker: "SCANS",
    startISO: "2026-10-05",
    endISO: "2026-10-12",
  },
  {
    id: "initial_fitness",
    label: "Initial Fitness Check-In",
    dateLabel: "10 October 2026",
    dateShort: "10 OCT",
    timelineLabel: "FITNESS CHECK-IN",
    startISO: "2026-10-10",
    endISO: "2026-10-10",
  },
  {
    id: "cracker_starts",
    label: "CRACKER Starts",
    dateLabel: "12 October 2026",
    dateShort: "12 OCT",
    timelineLabel: "CRACKER STARTS",
    startISO: "2026-10-12",
    endISO: "2026-10-12",
  },
  {
    id: "end_fitness",
    label: "End-of-Challenge Fitness Check-In",
    dateLabel: "22 November 2026",
    dateShort: "22 NOV",
    timelineLabel: "FINAL FITNESS",
    startISO: "2026-11-22",
    endISO: "2026-11-22",
  },
  {
    id: "final_scans",
    label: "Final Scans",
    dateLabel: "22–26 November 2026",
    dateShort: "22–26 NOV",
    timelineLabel: "Final",
    kicker: "SCANS",
    startISO: "2026-11-22",
    endISO: "2026-11-26",
  },
  {
    id: "party_weekend",
    label: "CRACKER Party Weekend",
    dateLabel: "27–29 November 2026",
    dateShort: "27–29 NOV",
    timelineLabel: "PARTY",
    startISO: "2026-11-27",
    endISO: "2026-11-29",
    note: "Your club will confirm its final party date.",
  },
  {
    id: "champion_announcement",
    label: "Staff Cracker Champion and WA Champion Announcement",
    dateLabel: "5 December 2026",
    dateShort: "5 DEC",
    timelineLabel: "CHAMPIONS",
    startISO: "2026-12-05",
    endISO: "2026-12-05",
  },
];

/** Short window label used in headers / onboarding. */
export const CRACKER_SEASON_WINDOW_LABEL = "12 Oct – 22 Nov 2026";

function parseLocalISO(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

function startOfLocalDay(now: Date): number {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

/** Earliest milestone that has not yet ended. */
export function nextChallengeMilestone(now = new Date()): ChallengeMilestone {
  const today = startOfLocalDay(now);
  const upcoming = CRACKER_CHALLENGE_MILESTONES.filter((item) => parseLocalISO(item.endISO) >= today).sort(
    (a, b) => parseLocalISO(a.startISO) - parseLocalISO(b.startISO),
  );
  return upcoming[0] ?? CRACKER_CHALLENGE_MILESTONES[CRACKER_CHALLENGE_MILESTONES.length - 1];
}

export function isMilestonePast(item: ChallengeMilestone, now = new Date()): boolean {
  return parseLocalISO(item.endISO) < startOfLocalDay(now);
}
