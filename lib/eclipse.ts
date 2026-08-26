/**
 * Official contact times for the 28 Aug 2026 partial lunar eclipse.
 *
 * Source of truth: Fred Espenak / NASA GSFC (EclipseWise / NASA lunar eclipse
 * catalog), UTC. Cross-checked against timeanddate.com and NASA SVS 5672.
 *
 * There is no totality. Umbral magnitude 0.93187; ~96.2% of the Moon disk
 * is inside Earth umbra at greatest eclipse (NASA SVS: 96.3%).
 *
 * Next lunar eclipse: 20 Feb 2027 penumbral (Espenak).
 */
export const UMBRAL_MAGNITUDE = 0.93187;
export const PENUMBRAL_MAGNITUDE = 1.96645;
export const GAMMA = 0.49644;
export const OBSCURATION = 0.962;

export const CONTACTS = {
  P1: Date.parse("2026-08-28T01:23:32.000Z"),
  U1: Date.parse("2026-08-28T02:33:25.000Z"),
  GREATEST: Date.parse("2026-08-28T04:12:55.000Z"),
  U4: Date.parse("2026-08-28T05:52:13.000Z"),
  P4: Date.parse("2026-08-28T07:02:03.000Z"),
} as const;

export const NEXT_ECLIPSE = {
  name: "Penumbral lunar eclipse",
  dateLabel: "20 February 2027",
  P1: Date.parse("2027-02-20T21:12:20.000Z"),
  GREATEST: Date.parse("2027-02-20T23:12:51.000Z"),
  P4: Date.parse("2027-02-21T01:13:19.000Z"),
} as const;

export type StageId =
  | "before"
  | "penumbral-in"
  | "partial-in"
  | "greatest"
  | "partial-out"
  | "penumbral-out"
  | "after";

export type Stage = {
  id: StageId;
  name: string;
  blurb: string;
};

const GREATEST_WINDOW_MS = 2 * 60 * 1000;

export const STAGES: Record<StageId, Stage> = {
  before: {
    id: "before",
    name: "Full Moon",
    blurb:
      "The Moon is still fully lit. A lunar eclipse begins when it first touches Earth penumbra — the outer, partial shadow.",
  },
  "penumbral-in": {
    id: "penumbral-in",
    name: "Penumbral eclipse",
    blurb:
      "The Moon is in Earth penumbra. Sunlight is only partly blocked, so the dimming is subtle — a soft shading, not a bite.",
  },
  "partial-in": {
    id: "partial-in",
    name: "Partial eclipse",
    blurb:
      "The Moon has entered Earth umbra, the dark inner shadow. A copper-red bite grows across the disk. This event never reaches totality.",
  },
  greatest: {
    id: "greatest",
    name: "Greatest eclipse",
    blurb:
      "Maximum coverage: umbral magnitude 0.932, about 96% of the disk inside the umbra. A bright sliver remains; the rest is copper-red. No totality.",
  },
  "partial-out": {
    id: "partial-out",
    name: "Partial eclipse",
    blurb:
      "The Moon is leaving the umbra. The dark bite shrinks and the full disk brightens again.",
  },
  "penumbral-out": {
    id: "penumbral-out",
    name: "Penumbral eclipse",
    blurb:
      "Only the outer penumbra remains on the Moon. Shading fades until the disk is fully lit.",
  },
  after: {
    id: "after",
    name: "Eclipse ended",
    blurb:
      "This partial lunar eclipse is over. Next: a penumbral lunar eclipse on 20 February 2027.",
  },
};

export const CONTACT_LIST: { key: keyof typeof CONTACTS; label: string }[] = [
  { key: "P1", label: "Penumbral begins" },
  { key: "U1", label: "Partial begins" },
  { key: "GREATEST", label: "Greatest" },
  { key: "U4", label: "Partial ends" },
  { key: "P4", label: "Penumbral ends" },
];

export function stageAt(t: number): Stage {
  const { P1, U1, GREATEST, U4, P4 } = CONTACTS;
  if (t < P1) return STAGES.before;
  if (t < U1) return STAGES["penumbral-in"];
  if (t < GREATEST - GREATEST_WINDOW_MS) return STAGES["partial-in"];
  if (t <= GREATEST + GREATEST_WINDOW_MS) return STAGES.greatest;
  if (t < U4) return STAGES["partial-out"];
  if (t < P4) return STAGES["penumbral-out"];
  return STAGES.after;
}

/** 0–1 progress through the umbral phase, peaking at 1 at greatest. */
export function umbralFraction(t: number): number {
  const { U1, GREATEST, U4 } = CONTACTS;
  if (t <= U1 || t >= U4) return 0;
  if (t <= GREATEST) return (t - U1) / (GREATEST - U1);
  return (U4 - t) / (U4 - GREATEST);
}

/** Instantaneous umbral magnitude (0 to 0.93187). */
export function umbralMagnitudeAt(t: number): number {
  return umbralFraction(t) * UMBRAL_MAGNITUDE;
}

/** Percent of this event max (0–100). */
export function percentOfMax(t: number): number {
  return umbralFraction(t) * 100;
}

/** 0–1 penumbral shading intensity. */
export function penumbraIntensity(t: number): number {
  const { P1, U1, U4, P4 } = CONTACTS;
  if (t <= P1 || t >= P4) return 0;
  if (t < U1) return (t - P1) / (U1 - P1);
  if (t > U4) return (P4 - t) / (P4 - U4);
  return 1;
}

/** Moon offset along the shadow axis, -1 (before) to +1 (after). Greatest at 0. */
export function shadowAxis(t: number): number {
  const { P1, GREATEST, P4 } = CONTACTS;
  if (t <= P1) return -1;
  if (t >= P4) return 1;
  if (t <= GREATEST) return -1 + (t - P1) / (GREATEST - P1);
  return (t - GREATEST) / (P4 - GREATEST);
}

export function remainingContacts(t: number) {
  return CONTACT_LIST.filter(({ key }) => CONTACTS[key] > t).map((c) => ({
    ...c,
    at: CONTACTS[c.key],
  }));
}

export function formatDuration(ms: number): string {
  const abs = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  if (h > 0) return h + "h " + String(m).padStart(2, "0") + "m " + String(s).padStart(2, "0") + "s";
  return String(m).padStart(2, "0") + "m " + String(s).padStart(2, "0") + "s";
}

export function formatLocal(ms: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(new Date(ms));
}

export function formatTime(ms: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(new Date(ms));
}

export const TIMELINE_START = CONTACTS.P1 - 30 * 60 * 1000;
export const TIMELINE_END = CONTACTS.P4 + 20 * 60 * 1000;
