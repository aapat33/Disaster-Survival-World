/**
 * Map definitions — shared by server (collision + safe-zone checks) and
 * client (mesh building). Everything is axis-aligned boxes so the same data
 * drives rendering, physics and survival logic.
 *
 * platform: { p:[x,y,z] centre, s:[w,h,d] size, c: colour, tag }
 * zone:     { type:'shelter'|'indoor'|'bunker'|'highground'|'open', p, s, label }
 */

const P = (p, s, c, tag = 'solid') => ({ p, s, c, tag });
const Z = (type, p, s, label) => ({ type, p, s, label });

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

/** Hollow room with a 2.4m doorway on the +Z wall. */
function room(x, z, w, d, h, color, roofColor = color) {
  const t = 0.4;
  const parts = [
    P([x, h / 2, z - d / 2], [w, h, t], color),
    P([x - w / 2, h / 2, z], [t, h, d], color),
    P([x + w / 2, h / 2, z], [t, h, d], color),
    P([x, h + 0.2, z], [w + 0.6, 0.4, d + 0.6], roofColor),
  ];
  const gap = 2.4;
  const side = (w - gap) / 2;
  parts.push(P([x - (gap / 2 + side / 2), h / 2, z + d / 2], [side, h, t], color));
  parts.push(P([x + (gap / 2 + side / 2), h / 2, z + d / 2], [side, h, t], color));
  parts.push(P([x, h - 0.4, z + d / 2], [gap, 0.8, t], color)); // lintel
  return parts;
}

/** Open-sided shelter: four posts + a roof slab. */
function shelter(x, z, w, d, h, color, roofColor) {
  const t = 0.35;
  const parts = [];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      parts.push(P([x + sx * (w / 2 - t), h / 2, z + sz * (d / 2 - t)], [t, h, t], color));
    }
  }
  parts.push(P([x, h + 0.25, z], [w + 0.8, 0.5, d + 0.8], roofColor));
  return parts;
}

/** Staircase climbing +X -> -X, auto-step friendly (0.5m risers). */
function stairs(x0, z, topY, width, color) {
  const parts = [];
  const steps = Math.round(topY / 0.5);
  const depth = 0.9;
  for (let i = 1; i <= steps; i++) {
    const top = i * 0.5;
    const cx = x0 - (i - 0.5) * depth;
    parts.push(P([cx, top / 2, z], [depth, top, width], color));
  }
  return parts;
}

/** Solid tower with a staircase attached to its west face. */
function tower(x, z, w, h, color, stairColor) {
  const parts = [P([x, h / 2, z], [w, h, w], color)];
  parts.push(...stairs(x - w / 2, z, h, 3, stairColor));
  parts.push(P([x, h + 0.15, z], [w + 0.6, 0.3, w + 0.6], stairColor));
  return parts;
}

/* ------------------------------------------------------------------ */
/* Standard arena generator                                            */
/* ------------------------------------------------------------------ */

function arena(theme, opts = {}) {
  const {
    towerH = 10,
    groundColor = 0x2b3140,
    structure = 0x475569,
    roof = 0x334155,
    accent = 0x64748b,
    extra = [],
  } = opts;

  const platforms = [
    P([0, -1, 0], [96, 2, 96], groundColor),
    ...shelter(14, -12, 6, 6, 4.6, structure, roof),
    ...room(-16, -10, 10, 8, 4, structure, roof),
    ...room(-14, 16, 8, 8, 3.4, 0x3f3f46, 0x27272a), // bunker (heavy concrete)
    ...tower(16, 14, 7, towerH, structure, accent),
    ...extra,
  ];

  const zones = [
    Z('shelter', [14, 2.2, -12], [5.4, 4.2, 5.4], 'SHELTER'),
    Z('indoor', [-16, 2, -10], [9.2, 3.8, 7.2], 'INTERIOR'),
    Z('bunker', [-14, 1.7, 16], [7.2, 3.2, 7.2], 'BUNKER'),
    Z('highground', [16, towerH + 1.4, 14], [7.4, 3, 7.4], 'HIGH GROUND'),
    Z('open', [0, 1.2, 2], [18, 3, 18], 'OPEN GROUND'),
  ];

  return { ...theme, spawn: [0, 0.2, 0], platforms, zones, killY: -12 };
}

/* ------------------------------------------------------------------ */
/* The obby                                                            */
/* ------------------------------------------------------------------ */

function buildObby() {
  const platforms = [];
  const colors = [0x0ea5e9, 0x22d3ee, 0x38bdf8, 0x06b6d4];
  let angle = 0;
  let radius = 6;
  let y = 4; // start above the initial water line

  for (let i = 0; i < 20; i++) {
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const rest = i % 5 === 4;
    const size = rest ? 4.8 : 3.2;
    platforms.push(P([x, y - 0.3, z], [size, 0.6, size], colors[i % colors.length]));
    y += 1.1;
    radius += 0.4;
    angle += 2.8 / radius;
  }

  const topX = Math.cos(angle) * radius;
  const topZ = Math.sin(angle) * radius;
  platforms.push(P([topX, y + 0.2, topZ], [9, 1, 9], 0xfbbf24));

  return {
    id: 'obby',
    name: 'The Obby',
    subtitle: '100% Flash Flood — climb or drown',
    obby: true,
    theme: {
      sky: 0x071b2b,
      fog: 0x0b2b3d,
      fogDensity: 0.012,
      sun: 0x9ad9ff,
      sunIntensity: 1.1,
      ambient: 0x2a5a75,
    },
    spawn: [6, 4.1, 0],
    platforms,
    zones: [Z('highground', [topX, y + 2.2, topZ], [9, 4, 9], 'SUMMIT')],
    killY: -10,
  };
}

/* ------------------------------------------------------------------ */
/* Map list                                                            */
/* ------------------------------------------------------------------ */

export const MAPS = [
  arena(
    {
      id: 'rooftops',
      name: 'Sunset Rooftops',
      subtitle: 'A dying city, one last golden hour',
      theme: {
        sky: 0x2a1e3d, fog: 0x3b2a4d, fogDensity: 0.008,
        sun: 0xffb37a, sunIntensity: 1.5, ambient: 0x6b5b8a,
      },
    },
    {
      groundColor: 0x2f2a3a, structure: 0x4a3f5c, roof: 0x342b45, accent: 0x6d5a86,
      extra: [
        P([-30, 6, -28], [10, 12, 10], 0x3a3048),
        P([30, 9, -26], [12, 18, 12], 0x352c42),
        P([-32, 4, 30], [14, 8, 14], 0x3f3550),
        P([30, 3, 32], [9, 6, 9], 0x3a3048),
      ],
    },
  ),
  arena(
    {
      id: 'frostbite',
      name: 'Frostbite Ridge',
      subtitle: 'Nothing lives up here for long',
      theme: {
        sky: 0x9fc6dd, fog: 0xcfe6f2, fogDensity: 0.014,
        sun: 0xffffff, sunIntensity: 1.2, ambient: 0xa8c8dd,
      },
    },
    {
      towerH: 12, groundColor: 0xdbe9f4, structure: 0x8aa3b8, roof: 0x6f8aa1, accent: 0xb9cfe0,
      extra: [
        P([-28, 3, -26], [7, 6, 7], 0xc3d8e8),
        P([26, 4, -24], [8, 8, 8], 0xbcd2e3),
        P([-30, 2, 26], [9, 4, 9], 0xc9dcea),
      ],
    },
  ),
  arena(
    {
      id: 'ember',
      name: 'Ember Hollow',
      subtitle: 'The mountain is awake',
      theme: {
        sky: 0x2b0f0a, fog: 0x4a1a0f, fogDensity: 0.016,
        sun: 0xff6a33, sunIntensity: 1.3, ambient: 0x7a2c17,
      },
    },
    {
      towerH: 11, groundColor: 0x2a1a17, structure: 0x4a2b22, roof: 0x351d18, accent: 0x6b3a2a,
      extra: [
        P([-26, 5, -24], [9, 10, 9], 0x3a221c),
        P([24, 3, -26], [6, 6, 6], 0x452a21),
        P([-28, 2, 28], [10, 4, 10], 0x3a221c),
        P([0, 1, -34], [26, 2, 6], 0x331c17),
      ],
    },
  ),
  arena(
    {
      id: 'neon',
      name: 'Neon Skyline',
      subtitle: 'The grid never sleeps',
      theme: {
        sky: 0x05010f, fog: 0x120a2a, fogDensity: 0.011,
        sun: 0x7c5cff, sunIntensity: 1.1, ambient: 0x2a1f5a,
      },
    },
    {
      towerH: 13, groundColor: 0x0d0a1a, structure: 0x1d1b3a, roof: 0x120f26, accent: 0x3b2f7a,
      extra: [
        P([-30, 8, -26], [8, 16, 8], 0x181633),
        P([28, 11, -24], [9, 22, 9], 0x14122c),
        P([-30, 5, 28], [11, 10, 11], 0x1b1838),
        P([26, 4, 30], [7, 8, 7], 0x171533),
      ],
    },
  ),
  buildObby(),
];

const BY_ID = new Map(MAPS.map((m) => [m.id, m]));

/** @returns {Object} */
export function getMap(id) {
  return BY_ID.get(id) ?? MAPS[0];
}

/** Random map, with a small bias away from repeating the current one. */
export function pickMap(currentId, rng = Math.random) {
  const pool = MAPS.filter((m) => m.id !== currentId);
  return pool[Math.floor(rng() * pool.length)] ?? MAPS[0];
}

export { P as box, Z as zone };
