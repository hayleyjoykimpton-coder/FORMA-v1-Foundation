/** User-facing brand strings — FORMA vs temporary Life & Soul Christmas Cracker mode. */

export type BrandMode = "forma" | "cracker";

export type BrandCopy = {
  name: string;
  shortName: string;
  wordmark: string;
  tagline: string;
  programmeName: string;
  challengeName: string;
  coachName: string;
};

export const FORMA_BRAND: BrandCopy = {
  name: "FORMA",
  shortName: "FORMA",
  wordmark: "FORMA",
  tagline: "Train with quiet consistency.",
  programmeName: "FORMA Foundation",
  challengeName: "",
  coachName: "Coach FORMA",
};

export const CRACKER_BRAND: BrandCopy = {
  name: "Life & Soul",
  shortName: "Life & Soul",
  wordmark: "Christmas Cracker",
  tagline: "MOVE · NOURISH · CONNECT — six weeks with Life & Soul Christmas Cracker.",
  programmeName: "Christmas Cracker",
  challengeName: "Christmas Cracker",
  coachName: "Life & Soul",
};

export function brandFor(mode: BrandMode): BrandCopy {
  return mode === "cracker" ? CRACKER_BRAND : FORMA_BRAND;
}
