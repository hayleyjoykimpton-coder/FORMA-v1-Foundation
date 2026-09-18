/** Shared Christmas Cracker challenge copy + destinations. */

export { NOURISH_COPY, NOURISH_PROGRAM_URL } from "./nourish";
export { CONNECT_COPY, CRACKER_FACEBOOK_URL } from "./connect";

export const CRACKER_HOME_LINES = [
  "Keep moving.",
  "Show up today.",
  "One session at a time.",
  "Stronger together.",
  "Fuel well. Train well.",
  "Finish the week strong.",
] as const;

export function crackerMotivationalLine(week: number): string {
  const i = Math.max(0, Math.min(5, week - 1));
  return CRACKER_HOME_LINES[i] ?? CRACKER_HOME_LINES[0];
}
