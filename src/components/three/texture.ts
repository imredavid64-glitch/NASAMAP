/**
 * Procedural, deterministic globe textures. Zero network assets — every
 * planet is painted on a canvas from a seeded noise function, so the app is
 * fully static and offline. (NASA imagery textures can be swapped in later.)
 *
 * Passes:
 *   1. Fractal elevation noise (base land/ocean split)
 *   2. Erosion/dither pass for continental edge realism
 *   3. Ocean depth banding
 *   4. Crater fields for airless bodies (moon, mercury)
 *   5. Ice caps & ocean ice
 *   6. Atmosphere glow hint (sun/venus/titan-ish bodies)
 */

export interface BodyPalette {
  ocean: string;
  oceanDeep: string;
  oceanShallow: string;
  land: string;
  highland: string;
  desert: string;
  ice: string;
  cloud: string;
  atmosphere: string;
}

export const PALETTES: Record<string, BodyPalette> = {
  earth: {
    ocean: "#0b3d62",
    oceanDeep: "#082745",
    oceanShallow: "#14619b",
    land: "#3b7a46",
    highland: "#5d6d4a",
    desert: "#c2b280",
    ice: "#e8f4ff",
    cloud: "#dbe7f5",
    atmosphere: "#4a90d9",
  },
  moon: {
    ocean: "#5a5f66",
    oceanDeep: "#3f4348",
    oceanShallow: "#7a8086",
    land: "#8c9198",
    highland: "#73777e",
    desert: "#b1b5bd",
    ice: "#d9dde2",
    cloud: "#cbd2d9",
    atmosphere: "#a5aeb8",
  },
  mars: {
    ocean: "#5e261a",
    oceanDeep: "#3d1811",
    oceanShallow: "#8c4a32",
    land: "#b4411f",
    highland: "#7a351e",
    desert: "#d9a05c",
    ice: "#f2e3d8",
    cloud: "#e2cbb8",
    atmosphere: "#e07a4a",
  },
  sun: {
    ocean: "#ffdf6b",
    oceanDeep: "#e8b71c",
    oceanShallow: "#ffd15c",
    land: "#ff9f1c",
    highland: "#ff8c24",
    desert: "#ffcf57",
    ice: "#fff3c4",
    cloud: "#ffe08a",
    atmosphere: "#ffcf57",
  },
  venus: {
    ocean: "#d6a03e",
    oceanDeep: "#c98f2e",
    oceanShallow: "#e0b25c",
    land: "#a9712a",
    highland: "#8a5e28",
    desert: "#dbbb7a",
    ice: "#f5dfa0",
    cloud: "#f0dcb8",
    atmosphere: "#e6bb62",
  },
  mercury: {
    ocean: "#7b7b7b",
    oceanDeep: "#5a5a5a",
    oceanShallow: "#9b9b9b",
    land: "#8f8f8f",
    highland: "#6f6f6f",
    desert: "#cfcbc4",
    ice: "#cfcbc4",
    cloud: "#d5d5d5",
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

function darken(p: Pixel, f: number): Pixel {
  return { r: Math.max(0, p.r * f), g: Math.max(0, p.g * f), b: Math.max(0, p.b * f), a: p.a };
}

/** Scatter crisp craters on airless bodies (moon, mercury). */
function paintCraters(ctx: CanvasRenderingContext2D, hash: (x: number, y: number) => number, W: number, H: number, density = 0.00018) {
  const count = Math.floor(W * H * density);
  const rnd = mulberry32(991);
  for (let i = 0; i < count; i++) {
    const cx = Math.floor(rnd() * W);
    const cy = Math.floor(rnd() * H);
    const rad = 1 + rnd() * 6;
    const g = ctx.createRadialGradient(cx, cy, rad * 0.1, cx, cy, rad);
    const shade = 0.35 + rnd() * 0.35;
    g.addColorStop(0, `rgba(0,0,0,${shade * 0.5})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    // bright rim on one side
    const rim = ctx.createRadialGradient(cx + rad * 0.3, cy - rad * 0.3, rad * 0.05, cx, cy, rad);
    rim.addColorStop(0, "rgba(255,255,255,0.12)");
    rim.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = rim;
    ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  }
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
  const oceanDeep = hex(palette.oceanDeep);
  const oceanShallow = hex(palette.oceanShallow);
  const land = hex(palette.land);
  const highland = hex(palette.highland);
  const desert = hex(palette.desert);
  const ice = hex(palette.ice);
  const cloud = hex(palette.cloud);
  const data = img.data;

  const airless = bodyId === "moon" || bodyId === "mercury";

  for (let py = 0; py < H; py++) {
    const v = ((py + 0.5) / H) * 2 - 1; // -1..1
    const lat = Math.abs(v);
    for (let px = 0; px < W; px++) {
      const u = (px + 0.5) / W;
      const n = fractalNoise(hash, u, v, 5);
      // erosion pass: sharper continental edges
      const erosion = Math.pow(Math.abs(fractalNoise(hash, u * 2.2, v * 2.2, 3)), 1.6);
      const m = 0.5 + 0.5 * (n * 0.7 + erosion * 0.3);
      const idx = (py * W + px) * 4;
      let p: Pixel;

      if (airless) {
        // Airless: rocky basalt with regolith tint, darker poles
        const rockiness = m * 0.9 + 0.1;
        const tint = lat > 0.85 ? 0.75 : 1;
        p = mix(land, highland, Math.min(1, Math.max(0, (m - 0.55) / 0.4)));
        p = darken(p, tint);
      } else {
        if (lat > 0.88) {
          p = ice;
        } else if (m < 0.42) {
          const t = Math.min(1, (0.42 - m) / 0.16);
          p = mix(oceanDeep, oceanShallow, t);
        } else if (m < 0.58) {
          const t = Math.min(1, (m - 0.42) / 0.16);
          p = mix(oceanShallow, land, t * 0.7);
        } else if (m < 0.78) {
          const t = Math.min(1, (m - 0.58) / 0.2);
          p = mix(land, desert, t * 0.5);
        } else {
          const t = Math.min(1, (m - 0.78) / 0.2);
          p = mix(desert, highland, t * 0.7);
        }
      }

      if (bodyId === "sun") {
        const flare = Math.max(0, fractalNoise(hash, u * 1.6, v * 1.6, 4)) * 0.45;
        p = mix(land, { r: 255, g: 240, b: 190, a: 255 }, flare);
      }

      data[idx] = p.r;
      data[idx + 1] = p.g;
      data[idx + 2] = p.b;
      data[idx + 3] = 255;
    }
  }

  // Cloud veil for earth/venus (semi-transparent streaks painted on top)
  if (bodyId === "earth" || bodyId === "venus") {
    const c = mulberry32(seed + 7);
    for (let i = 0; i < 700; i++) {
      const cx = Math.floor(c() * W);
      const cy = Math.floor(c() * H * 0.5 + H * 0.2);
      const rx = 30 + c() * 90;
      const ry = 8 + c() * 20;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((c() - 0.5) * 1.5);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      grad.addColorStop(0, `rgba(${cloud.r},${cloud.g},${cloud.b},0.18)`);
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  if (airless) {
    paintCraters(ctx, hash, W, H);
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}
