/**
 * Single source of truth for Christmas Cracker 2026 challenge milestones.
 * Import from here — do not hardcode dates in multiple components.
 */

export type ChallengeMilestone = {
  id: string;
  label: string;
  dateLabel: string;
  /** Optional supporting note shown under the date. */
  note?: string;
};

export const CRACKER_CHALLENGE_MILESTONES: ChallengeMilestone[] = [
  {
    id: "registration_close",
    label: "Official Registration Close",
    dateLabel: "12 October 2026",
  },
  {
    id: "pre_challenge_scans",
    label: "Pre-Challenge Scans",
    dateLabel: "5–12 October 2026",
  },
  {
    id: "initial_fitness",
    label: "Initial Fitness Check-In",
    dateLabel: "10 October 2026",
  },
  {
    id: "cracker_starts",
    label: "CRACKER Starts",
    dateLabel: "12 October 2026",
  },
  {
    id: "end_fitness",
    label: "End-of-Challenge Fitness Check-In",
    dateLabel: "22 November 2026",
  },
  {
    id: "final_scans",
    label: "Final Scans",
    dateLabel: "22–26 November 2026",
  },
  {
    id: "party_weekend",
    label: "CRACKER Party Weekend",
    dateLabel: "27–29 November 2026",
    note: "Your club will confirm its final party date.",
  },
  {
    id: "champion_announcement",
    label: "Staff Cracker Champion and WA Champion Announcement",
    dateLabel: "5 December 2026",
  },
];

/** Short window label used in headers / onboarding. */
export const CRACKER_SEASON_WINDOW_LABEL = "12 Oct – 22 Nov 2026";
