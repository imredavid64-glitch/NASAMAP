import launchVehicles from "@/data/launch-vehicles.json";
import { type CustomVehicleSpec, type Destination, CUSTOM_VEHICLE_ID } from "@/lib/mission";

export { type Destination } from "@/lib/mission";

export interface DesignInput {
  destination: Destination;
  vehicleId: string;
  crew: number;
  surfaceDays: number;
  /**
   * Optional user-designed launch vehicle (Rocket Builder). When present it is
   * carried in the link and rebuilt on the far side.
   */
  customVehicle?: CustomVehicleSpec;
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
  if (design.customVehicle) {
    const cv = design.customVehicle;
    params.set("v", CUSTOM_VEHICLE_ID);
    params.set("cvn", cv.name);
    params.set("cvpl", String(Math.round(cv.payloadLEOKg)));
    params.set("cvtl", String(Math.round(cv.payloadTLIKg)));
    params.set("cvisp", String(Math.round(cv.ispVacuumS)));
    params.set("cvst", String(Math.round(cv.stages)));
    params.set("cvcost", String(Math.round(cv.costPerLaunchUsd)));
  }
  return params.toString();
}

function parseCustomVehicle(
  raw: Record<string, string | string[] | undefined>,
): CustomVehicleSpec | undefined {
  const pick = (key: string): string | undefined => {
    const v = raw[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const payloadLEOKg = Number(pick("cvpl"));
  if (!Number.isFinite(payloadLEOKg) || payloadLEOKg <= 0) return undefined;
  const tli = Number(pick("cvtl"));
  const isp = Number(pick("cvisp"));
  const stages = Number(pick("cvst"));
  const cost = Number(pick("cvcost"));
  return {
    name: (pick("cvn") || "Custom Rocket").slice(0, 60),
    payloadLEOKg,
    payloadTLIKg: Number.isFinite(tli) && tli > 0 ? tli : 0,
    ispVacuumS: Number.isFinite(isp) && isp > 0 ? isp : 311,
    stages: Number.isFinite(stages) && stages > 0 ? Math.round(stages) : 2,
    costPerLaunchUsd: Number.isFinite(cost) && cost > 0 ? cost : 0,
  };
}

/** Parse and validate a design from URL query params, falling back per field. */
export function decodeDesign(raw: Record<string, string | string[] | undefined>): DesignInput {
  const pick = (key: string): string | undefined => {
    const v = raw[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const destRaw = pick("d");
  const destination: Destination = destRaw === "moon" || destRaw === "mars" || destRaw === "exoplanet" ? destRaw : DEFAULT_DESIGN.destination;

  const customVehicle = parseCustomVehicle(raw);
  const vehicleRaw = pick("v");
  const vehicleId =
    customVehicle
      ? CUSTOM_VEHICLE_ID
      : vehicleRaw && VEHICLE_IDS.includes(vehicleRaw)
        ? vehicleRaw
        : DEFAULT_DESIGN.vehicleId;

  return {
    destination,
    vehicleId,
    crew: clampInt(pick("c"), CREW_MIN, CREW_MAX, DEFAULT_DESIGN.crew),
    surfaceDays: clampInt(pick("s"), SURFACE_DAYS_MIN, SURFACE_DAYS_MAX, DEFAULT_DESIGN.surfaceDays),
    ...(customVehicle ? { customVehicle } : {}),
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

/**
 * URL-safe, reversible encoding of a design for use in a **path segment**.
 *
 * `encodeDesignQuery` returns a query string ("d=mars&v=starship&c=4&s=90").
 * A query string is not safe as a path segment: "&" and "=" are percent-encoded
 * by the router, so the value that reaches the page no longer matches the one
 * that was stored and the lookup silently misses.
 *
 * This slug uses only unreserved URL characters in a fixed field order, so it
 * survives routing byte-for-byte:
 *   "<destination>-c<crew>-s<surfaceDays>-<vehicleId>"
 * The variable-length vehicle id comes last so ids containing "-" still parse.
 * A user-designed vehicle is encoded as "custom-<payloadLEOKg>-<payloadTLIKg>".
 */
export function encodeDesignSlug(design: DesignInput): string {
  const { destination, vehicleId, crew, surfaceDays } = design;
  const vehicle =
    design.customVehicle
      ? `${CUSTOM_VEHICLE_ID}-${Math.round(design.customVehicle.payloadLEOKg)}-${Math.round(design.customVehicle.payloadTLIKg)}`
      : vehicleId;
  return `${destination}-c${crew}-s${surfaceDays}-${vehicle}`;
}

/**
 * Inverse of {@link encodeDesignSlug}. Returns null when the slug is malformed
 * or names a vehicle that is not in the published catalogue.
 */
export function decodeDesignSlug(slug: string): DesignInput | null {
  const m = /^([a-z]+)-c(\d+)-s(\d+)-(.+)$/.exec(slug);
  if (!m) return null;

  const destination = m[1];
  if (destination !== "moon" && destination !== "mars" && destination !== "exoplanet") {
    return null;
  }

  const vehicle = m[4];
  const custom = /^custom-(\d+)-(\d+)$/.exec(vehicle);
  if (custom) {
    const payloadLEOKg = Number(custom[1]);
    if (!Number.isFinite(payloadLEOKg) || payloadLEOKg <= 0) return null;
    const payloadTLIKg = Number(custom[2]);
    return {
      destination,
      vehicleId: CUSTOM_VEHICLE_ID,
      crew: clampInt(m[2], CREW_MIN, CREW_MAX, DEFAULT_DESIGN.crew),
      surfaceDays: clampInt(m[3], SURFACE_DAYS_MIN, SURFACE_DAYS_MAX, DEFAULT_DESIGN.surfaceDays),
      customVehicle: {
        name: "Custom Rocket",
        payloadLEOKg,
        payloadTLIKg: Number.isFinite(payloadTLIKg) && payloadTLIKg > 0 ? payloadTLIKg : 0,
        ispVacuumS: 311,
        stages: 2,
        costPerLaunchUsd: 0,
      },
    };
  }

  if (!VEHICLE_IDS.includes(vehicle)) return null;

  return {
    destination,
    vehicleId: vehicle,
    crew: clampInt(m[2], CREW_MIN, CREW_MAX, DEFAULT_DESIGN.crew),
    surfaceDays: clampInt(m[3], SURFACE_DAYS_MIN, SURFACE_DAYS_MAX, DEFAULT_DESIGN.surfaceDays),
  };
}

/**
 * Rebuild a Rocket Builder vehicle spec from a stored mission-design snapshot.
 * Returns undefined for published catalogue vehicles.
 */
export function customVehicleFromVehicle(vehicle: {
  id: string;
  name: string;
  payloadLEOKg: number;
  payloadTLIKg: number;
  ispVacuumS: number;
  stages: number;
  costPerLaunchUsd: number;
}): CustomVehicleSpec | undefined {
  if (vehicle.id !== CUSTOM_VEHICLE_ID) return undefined;
  return {
    name: vehicle.name,
    payloadLEOKg: vehicle.payloadLEOKg,
    payloadTLIKg: vehicle.payloadTLIKg,
    ispVacuumS: vehicle.ispVacuumS,
    stages: vehicle.stages,
    costPerLaunchUsd: vehicle.costPerLaunchUsd,
  };
}

/** True when the design differs from the default (i.e. worth persisting in the URL). */
export function isCustomDesign(design: DesignInput): boolean {
  return (
    design.destination !== DEFAULT_DESIGN.destination ||
    design.vehicleId !== DEFAULT_DESIGN.vehicleId ||
    design.crew !== DEFAULT_DESIGN.crew ||
    design.surfaceDays !== DEFAULT_DESIGN.surfaceDays ||
    design.customVehicle !== undefined
  );
}
