/**
 * Procedural, deterministic globe textures. Zero network assets — every
 * planet is painted on a canvas from a seeded noise function, so the app is
 * fully static and offline. (NASA imagery textures can be swapped in later.)
 */

export interface BodyPalette {
  ocean: string;
  oceanShallow: string;
  land: string;
  highland: string;
  ice: string;
  atmosphere: string;
}

export const PALETTES: Record<string, BodyPalette> = {
  earth: {
    ocean: "#062e5c",
    oceanShallow: "#0a5b8c",
    land: "#1f6b3a",
    highland: "#8a6a3a",
    ice: "#e8f4ff",
    atmosphere: "#58c8ff",
  },
  moon: {
    ocean: "#9aa0a8",
    oceanShallow: "#b6bcc4",
    land: "#8c9198",
    highland: "#6e737a",
    ice: "#d9dde2",
    atmosphere: "#cbd2d9",
  },
  mars: {
    ocean: "#b4411f",
    oceanShallow: "#d2693a",
    land: "#9c3a20",
    highland: "#5e261a",
    ice: "#f2e3d8",
    atmosphere: "#e07a4a",
  },
  sun: {
    ocean: "#ffdf6b",
    oceanShallow: "#ffb703",
    land: "#ff9f1c",
    highland: "#e8890c",
    ice: "#fff3c4",
    atmosphere: "#ffcf57",
  },
  venus: {
    ocean: "#d6a03e",
    oceanShallow: "#c98f2e",
    land: "#a9712a",
    highland: "#7c5220",
    ice: "#f5dfa0",
    atmosphere: "#e6bb62",
  },
  mercury: {
    ocean: "#9b9b9b",
    oceanShallow: "#857f78",
    land: "#6f6a64",
    highland: "#55504c",
    ice: "#cfcbc4",
    atmosphere: "#a8a29e",
  },
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeHash(seed: number) {
  const rand = mulberry32(seed);
  const table: number[] = [];
  for (let i = 0; i < 1024; i++) table.push(rand());
  return (x: number, y: number) => {
    const i = ((Math.round(x * 31.4159) % 1000) + 1000) % 1000;
    const j = ((Math.round(y * 31.4159) % 1000) + 1000) % 1000;
    return table[(i + j * 997) % 1024];
  };
}

function valueNoise2D(hash: (x: number, y: number) => number, u: number, v: number) {
  const xi = Math.floor(u);
  const yi = Math.floor(v);
  const xf = u - xi;
  const yf = v - yi;
  const sx = xf * xf * (3 - 2 * xf);
  const sy = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function fractalNoise(hash: (x: number, y: number) => number, u: number, v: number, octaves: number) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise2D(hash, u * freq * 4, v * freq * 4);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

interface Pixel {
  r: number;
  g: number;
  b: number;
  a: number;
}

function hex(c: string): Pixel {
  const n = parseInt(c.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 255 };
}

function mix(a: Pixel, b: Pixel, t: number): Pixel {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
    a: 255,
  };
}

/**
 * Paint a 1024×512 equirect texture for a celestial body.
 * latitude (v): -1 (south) .. 1 (north); longitude u: 0..1.
 */
export function paintGlobeTexture(bodyId: string, seed = 1337): HTMLCanvasElement {
  const W = 1024;
  const H = 512;
  const palette = PALETTES[bodyId] ?? PALETTES.earth;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(W, H);
  const hash = makeHash(seed);
  const ocean = hex(palette.ocean);
  const shallow = hex(palette.oceanShallow);
  const land = hex(palette.land);
  const high = hex(palette.highland);
  const ice = hex(palette.ice);
  const data = img.data;

  for (let py = 0; py < H; py++) {
    const v = ((py + 0.5) / H) * 2 - 1; // -1..1
    const lat = Math.abs(v);
    for (let px = 0; px < W; px++) {
      const u = (px + 0.5) / W;
      const n = fractalNoise(hash, u, v, 5);
      const m = 0.5 + 0.5 * n;
      const idx = (py * W + px) * 4;
      let p: Pixel;
      if (lat > 0.86) {
        p = ice;
      } else if (m < 0.47) {
        p = mix(ocean, shallow, Math.min(1, (0.47 - m) / 0.12) * 0.5 + 0.25);
      } else if (m < 0.62) {
        p = mix(land, shallow, Math.min(1, (m - 0.47) / 0.08) * 0.35);
      } else {
        const t = Math.min(1, (m - 0.62) / 0.2);
        p = mix(land, high, t * 0.85);
      }
      if (bodyId === "sun") {
        const flare = Math.max(0, n) * 0.35;
        p = mix(ocean, { r: 255, g: 250, b: 210, a: 255 }, flare);
      }
      data[idx] = p.r;
      data[idx + 1] = p.g;
      data[idx + 2] = p.b;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}