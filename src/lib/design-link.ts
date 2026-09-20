import launchVehicles from "@/data/launch-vehicles.json";

export type Destination = "moon" | "mars";

export interface DesignInput {
  destination: Destination;
  vehicleId: string;
  crew: number;
  surfaceDays: number;
}

export const DEFAULT_DESIGN: DesignInput = {
  destination: "mars",
  vehicleId: "starship",
  crew: 4,
  surfaceDays: 90,
};

export const CREW_MIN = 1;
export const CREW_MAX = 6;
export const SURFACE_DAYS_MIN = 0;
export const SURFACE_DAYS_MAX = 365;

const VEHICLE_IDS: string[] = (launchVehicles as { id: string }[]).map((v) => v.id);

function clampInt(raw: unknown, min: number, max: number, fallback: number): number {
  const n = typeof raw === "string" ? Number.parseInt(raw, 10) : Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Serialise a design into a stable, shareable query string (no leading "?"). */
export function encodeDesignQuery(design: DesignInput): string {
  const params = new URLSearchParams();
  params.set("d", design.destination);
  params.set("v", design.vehicleId);
  params.set("c", String(design.crew));
  params.set("s", String(design.surfaceDays));
  return params.toString();
}

/** Parse and validate a design from URL query params, falling back per field. */
export function decodeDesign(raw: Record<string, string | string[] | undefined>): DesignInput {
  const pick = (key: string): string | undefined => {
    const v = raw[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const destRaw = pick("d");
  const destination: Destination = destRaw === "moon" || destRaw === "mars" ? destRaw : DEFAULT_DESIGN.destination;

  const vehicleRaw = pick("v");
  const vehicleId = vehicleRaw && VEHICLE_IDS.includes(vehicleRaw) ? vehicleRaw : DEFAULT_DESIGN.vehicleId;

  return {
    destination,
    vehicleId,
    crew: clampInt(pick("c"), CREW_MIN, CREW_MAX, DEFAULT_DESIGN.crew),
    surfaceDays: clampInt(pick("s"), SURFACE_DAYS_MIN, SURFACE_DAYS_MAX, DEFAULT_DESIGN.surfaceDays),
  };
}

/** Parse and validate a design from URL query string (convenience wrapper). */
export function decodeDesignQuery(queryString: string): DesignInput {
  const params = new URLSearchParams(queryString);
  const raw: Record<string, string | string[] | undefined> = {};
  params.forEach((value, key) => {
    raw[key] = value;
  });
  return decodeDesign(raw);
}

/** True when the design differs from the default (i.e. worth persisting in the URL). */
export function isCustomDesign(design: DesignInput): boolean {
  return (
    design.destination !== DEFAULT_DESIGN.destination ||
    design.vehicleId !== DEFAULT_DESIGN.vehicleId ||
    design.crew !== DEFAULT_DESIGN.crew ||
    design.surfaceDays !== DEFAULT_DESIGN.surfaceDays
  );
}
