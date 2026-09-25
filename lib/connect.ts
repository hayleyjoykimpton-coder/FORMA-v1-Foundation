/** CONNECT pillar — community lives on Facebook (closed Cracker groups + public page). */

/** Christmas Cracker Facebook community group. */
export const CRACKER_FACEBOOK_URL = "https://www.facebook.com/share/g/19T34j4bk8/";

/** Life + Soul Mayfair community photo (medicine-ball group) for CONNECT hero. */
export const CONNECT_HERO_IMAGE = "/cracker/connect/connect-hero-community.jpg";

export const CONNECT_COPY = {
  title: "CONNECT",
  supporting: "Everything happening across Cracker.",
  section: "STAY CONNECTED",
  body: "Events, updates and community posts are shared in our Christmas Cracker Facebook group.",
  cta: "OPEN CRACKER FACEBOOK",
  questionBombEyebrow: "EVERY THURSDAY",
  questionBombTitle: "QUESTION BOMB",
  questionBombBody:
    "Naomi Gillespie answers nutrition questions live every Thursday. Drop yours on the CRACKER Facebook page.",
  questionBombCta: "MESSAGE CRACKER PAGE",
  facebookLiveIntro: "The Facebook group is the live source for:",
  eventsTitle: "WEEKLY CRACKER EVENTS",
  eventsSupporting: "Train together. Connect. Have some fun.",
  eventsNote:
    "Each club runs its own weekly community event. Check the Cracker Facebook page for your club's confirmed date, time and location.",
  eventsCta: "VIEW THIS WEEK'S EVENT",
  eventFormatsNote:
    "Your club may run its weekly community session as a Super Saturday, Super Sunday or Friday Night Lights event.",
  eventDetailsCta: "CHECK FACEBOOK FOR DETAILS",
  viewEventDetailsCta: "VIEW EVENT DETAILS",
  moreWaysTitle: "MORE WAYS TO CONNECT",
  facebookLiveFooter:
    "For exact dates, times, locations, what to bring, bookings and last-minute changes, always check the CRACKER Facebook page.",
  includedTitle: "WHAT'S INCLUDED",
  includedSupporting: "Your CRACKER line-up at a glance.",
  crackerOfWeekEyebrow: "EACH WEEK",
  crackerOfWeekTitle: "CRACKER OF THE WEEK",
  crackerOfWeekBody:
    "Each club recognises one member each week who reflects the spirit of CRACKER.",
  crackerOfWeekCta: "SEE THIS WEEK'S CRACKER",
  partyEyebrow: "END OF CHALLENGE",
  partyTitle: "CRACKER PARTY",
  partyDate: "27–29 NOVEMBER 2026",
  partyBody: "Your club will confirm its final party date.",
  partyCta: "CHECK PARTY UPDATES",
} as const;

export const CONNECT_FACEBOOK_USES = [
  "weekly updates",
  "education",
  "challenges",
  "event information",
  "Cracker of the Week",
  "community conversation",
  "motivation and support",
] as const;

export const CONNECT_EVENT_FORMATS = [
  "SUPER SATURDAY",
  "SUPER SUNDAY",
  "FRIDAY NIGHT LIGHTS",
] as const;

export type ConnectEventAction = {
  label: string;
  /** Empty = not ready. Never use a placeholder URL. */
  url: string;
  type: "external" | "internal" | "facebook";
};

export type ConnectEvent = {
  id: number;
  week: string;
  title: string;
  description: string;
  action: ConnectEventAction | null;
};

export const CONNECT_EVENTS: ConnectEvent[] = [
  {
    id: 1,
    week: "WEEK 1",
    title: "KICK-OFF / MANAGER'S CHOICE",
    description: "Fitness Check-In or a community training session.",
    action: null,
  },
  {
    id: 2,
    week: "WEEK 2",
    title: "MANAGER'S CHOICE",
    description: "Local club activity / community session.",
    action: null,
  },
  {
    id: 3,
    week: "WEEK 3",
    title: "TYG PAYDAY / MAJOR COMMUNITY SESSION",
    description: "Community training + catch-up.",
    action: {
      label: "BOOK SESSION",
      url: "",
      type: "external",
    },
  },
  {
    id: 4,
    week: "WEEK 4",
    title: "WELLNESS FOCUS",
    description: "Wellness, recovery, breathwork or community activity.",
    action: null,
  },
  {
    id: 5,
    week: "WEEK 5",
    title: "AMAZING RACE",
    description: "Team-based challenge and community session.",
    action: {
      label: "VIEW EVENT DETAILS",
      url: "",
      type: "facebook",
    },
  },
  {
    id: 6,
    week: "WEEK 6",
    title: "FINAL FITNESS CHECK-IN",
    description: "Complete your final fitness testing and celebrate your six weeks.",
    action: null,
  },
];

/** @deprecated use CONNECT_EVENTS */
export const CONNECT_EVENT_WEEKS = CONNECT_EVENTS;

export const CONNECT_MORE_WAYS = [
  {
    title: "RUN CLUBS",
    body: "Community Run Clubs with TYG, location dependent.",
  },
  {
    title: "MAT PILATES",
    body: "Sunday Mat Pilates at TYG, location dependent.",
  },
  {
    title: "REFORMER PILATES",
    body: "2 included Reformer Pilates classes, location dependent.",
  },
  {
    title: "COMMUNITY CATCH UPS",
    body: "Coffee, walks and social catch-ups throughout the challenge.",
  },
] as const;

export const CONNECT_CRACKER_SPIRIT = [
  "Consistency",
  "Community involvement",
  "Showing up",
  "Supporting others",
  "Positive habits",
] as const;

export type IncludeFlag = "optional" | "location";

export type IncludeItem = {
  text: string;
  flag?: IncludeFlag;
};

export type IncludeCategory = {
  key: string;
  title: string;
  preview: string;
  items: IncludeItem[];
};

export const CONNECT_INCLUDED: IncludeCategory[] = [
  {
    key: "move",
    title: "MOVE",
    preview: "Training, education + community movement",
    items: [
      { text: "Six week training plan with Jess McKee" },
      { text: "Structured gym floor training guidance with Jess McKee" },
      { text: "Weekly community training events" },
      { text: "Training education with Jess McKee" },
      { text: "Community Run Clubs with TYG", flag: "location" },
      { text: "2 x Reformer Pilates classes included", flag: "location" },
      { text: "Sunday Mat Pilates at TYG", flag: "location" },
    ],
  },
  {
    key: "nourish",
    title: "NOURISH",
    preview: "Base plan, education + optional coaching",
    items: [
      { text: "Six week base nutrition plan with Naomi Gillespie" },
      { text: "Nutrition education with Naomi Gillespie" },
      { text: "Optional personalised nutrition with Jess Lowe", flag: "optional" },
    ],
  },
  {
    key: "wellness",
    title: "WELLNESS",
    preview: "Scans, check-ins + optional Soul Wellness",
    items: [
      { text: "Wellness activities and community wellness sessions" },
      { text: "Optional $10 Soul Wellness add on, where available", flag: "optional" },
      { text: "Initial and final InBody scans" },
      { text: "Initial and final Fitness Check In" },
    ],
  },
  {
    key: "connect",
    title: "CONNECT",
    preview: "Community, challenges + Cracker of the Week",
    items: [
      { text: "Community catch ups" },
      { text: "CRACKER Facebook community group" },
      { text: "CRACKER team challenges" },
      { text: "Weekly Cracker of the Week prizes" },
    ],
  },
  {
    key: "extras",
    title: "EXTRAS",
    preview: "Merch, party ticket + prizes",
    items: [
      { text: "CRACKER merchandise pack" },
      { text: "Christmas Party ticket included" },
      { text: "Opportunity to win CRACKER prizes and awards at the end of the challenge" },
    ],
  },
];
