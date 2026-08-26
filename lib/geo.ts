export const AUSTIN = {
  lat: 30.2672,
  lon: -97.7431,
  label: "Austin, TX",
} as const;

export const DEFAULT_ZONE = "America/Chicago";

/**
 * Most of Texas is America/Chicago (CDT in August).
 * El Paso and Hudspeth counties observe America/Denver (MDT).
 * Approximate boundary ~104.05 W.
 */
export function zoneFromCoords(lat: number, lon: number): string {
  const inTexasBand = lat >= 25.8 && lat <= 36.6 && lon <= -93.3 && lon >= -107.1;
  if (inTexasBand && lon <= -104.05) return "America/Denver";
  return DEFAULT_ZONE;
}

export type GeoState = {
  lat: number;
  lon: number;
  label: string;
  timeZone: string;
  source: "geo" | "default";
};

export function resolveGeo(lat: number, lon: number): GeoState {
  const timeZone = zoneFromCoords(lat, lon);
  const westTx = timeZone === "America/Denver";
  return {
    lat,
    lon,
    label: westTx ? "West Texas (MDT)" : "Texas (CDT)",
    timeZone,
    source: "geo",
  };
}

export function defaultGeo(): GeoState {
  return {
    lat: AUSTIN.lat,
    lon: AUSTIN.lon,
    label: AUSTIN.label,
    timeZone: DEFAULT_ZONE,
    source: "default",
  };
}
