/**
 * Disaster catalogue.
 *
 * difficulty  -> EASY | MEDIUM | HARD | EXTREME
 * weight      -> relative pick chance (0 = never randomly picked)
 * safe        -> zone types on the map that protect you
 * rising      -> water/lava climbs from `from` to `to` (world Y) over the round
 * obbyOnly    -> only appears on the obby map
 */

export const DIFFICULTY = {
  EASY:    { label: 'Easy',    color: '#4ade80', rank: 1 },
  MEDIUM:  { label: 'Medium',  color: '#fbbf24', rank: 2 },
  HARD:    { label: 'Hard',    color: '#fb7185', rank: 3 },
  EXTREME: { label: 'Extreme', color: '#a78bfa', rank: 4 },
};

/** @type {Array<Object>} */
export const DISASTERS = [
  {
    id: 'acidrain', name: 'Acid Rain', difficulty: 'EASY', weight: 12,
    duration: 26, safe: ['shelter', 'indoor'], fx: 'rain',
    color: '#a3e635', hint: 'Get under a roof — the sky is melting.',
  },
  {
    id: 'lightning', name: 'Lightning Storm', difficulty: 'EASY', weight: 12,
    duration: 24, safe: ['indoor', 'shelter'], fx: 'lightning',
    color: '#fde68a', hint: 'Stay inside. Open ground is a lightning rod.',
  },
  {
    id: 'sandstorm', name: 'Sandstorm', difficulty: 'EASY', weight: 10,
    duration: 24, safe: ['indoor'], fx: 'sand',
    color: '#f59e0b', hint: 'Seek a sealed interior — shelters get buried.',
  },
  {
    id: 'earthquake', name: 'Earthquake', difficulty: 'MEDIUM', weight: 10,
    duration: 22, safe: ['open'], fx: 'quake',
    color: '#94a3b8', hint: 'Get to open ground. Buildings are falling.',
  },
  {
    id: 'tornado', name: 'Tornado', difficulty: 'MEDIUM', weight: 9,
    duration: 28, safe: ['indoor', 'shelter'], fx: 'tornado',
    color: '#67e8f9', hint: 'A funnel is tearing through. Get indoors.',
  },
  {
    id: 'meteor', name: 'Meteor Shower', difficulty: 'MEDIUM', weight: 9,
    duration: 26, safe: ['indoor', 'shelter', 'bunker'], fx: 'meteor',
    color: '#fb923c', hint: 'Rocks from orbit. Any roof will do.',
  },
  {
    id: 'tsunami', name: 'Tsunami', difficulty: 'HARD', weight: 6,
    duration: 30, safe: ['highground'], fx: 'wave',
    color: '#38bdf8', hint: 'Climb. The water is coming for the low ground.',
  },
  {
    id: 'volcano', name: 'Volcano Eruption', difficulty: 'HARD', weight: 6,
    duration: 30, safe: ['highground', 'bunker'], fx: 'lava',
    color: '#f97316', hint: 'Lava is rising. Get up high or into the bunker.',
  },
  {
    id: 'blizzard', name: 'Blizzard', difficulty: 'HARD', weight: 6,
    duration: 28, safe: ['indoor', 'shelter'], fx: 'snow',
    color: '#e0f2fe', hint: 'Whiteout conditions. Find warmth indoors.',
  },
  {
    id: 'solarflare', name: 'Solar Flare', difficulty: 'EXTREME', weight: 3,
    duration: 30, safe: ['bunker', 'indoor'], fx: 'flare',
    color: '#f43f5e', hint: 'Radiation wave. Only thick walls survive.',
  },
  {
    id: 'nuke', name: 'Nuclear Bomb', difficulty: 'EXTREME', weight: 1,
    duration: 36, safe: ['bunker'], fx: 'nuke', rare: true,
    color: '#fca5a5', hint: 'THE BOMB IS FALLING. Bunker. NOW.',
  },
  {
    id: 'flashflood', name: 'Flash Flood', difficulty: 'HARD', weight: 0,
    duration: 50, safe: [], fx: 'flood', obbyOnly: true,
    rising: { from: 0.5, to: 24.5 }, color: '#22d3ee',
    hint: 'CLIMB! The water never stops rising on the obby.',
  },
];

const BY_ID = new Map(DISASTERS.map((d) => [d.id, d]));

/** @returns {Object} */
export function getDisaster(id) {
  return BY_ID.get(id) ?? DISASTERS[0];
}

/**
 * Weighted random pick, filtered by the map.
 * The obby map ALWAYS gets Flash Flood (100% forced, as requested).
 */
export function pickDisaster(map, rng = Math.random) {
  if (map.obby) return getDisaster('flashflood');

  const pool = DISASTERS.filter((d) => !d.obbyOnly && d.weight > 0);
  const total = pool.reduce((sum, d) => sum + d.weight, 0);
  let roll = rng() * total;
  for (const d of pool) {
    roll -= d.weight;
    if (roll <= 0) return d;
  }
  return pool[pool.length - 1];
}

/** Chance the next round is the nuclear bomb (very rare, ~1.5%). */
export function rollNuclear(map, rng = Math.random) {
  if (map.obby) return false;
  return rng() < 0.015;
}
