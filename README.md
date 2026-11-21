☢ DISASTER SURVIVAL 3D

A real-time 3D multiplayer disaster-survival game. One round, one disaster, one winner. Survive the timer or be the last one standing.

Language: JavaScript (ES2022 modules). Node.js + Socket.IO on the server, Three.js (WebGL) in the browser, JSDoc type annotations throughout. One language end-to-end, zero build step, no Firebase — multiplayer is raw WebSockets.

Run it

cd disaster-game
npm install
npm start
# -> http://localhost:3000

Open the URL in two browser tabs (or on two devices on your LAN) and sign in with different usernames to play together.

Features

 Feature Implementation

 3D world Three.js, box-based maps, third-person orbit camera, AABB physics with auto step-up

 Multiplayer Socket.IO — 15 Hz position replication, server-authoritative rounds

 Chat Real-time broadcast, rate-limited (1 msg / 1.1 s), 140 char cap, history replay for new joiners

 Accounts Username + password, scrypt hashing, HMAC-signed stateless session tokens, win/round stats

 Rounds 20 s intermission → round → 7 s results → repeat, forever

 Disasters 12 types across 4 difficulty tiers, weighted random, rising hazards

 Maps 5 arenas including a dedicated obby that is 100% flash flood

No database, no cloud services. Accounts live in data/accounts.json, the signing key in data/secret.key.

Round flow

INTERMISSION (20 s)  ->  ROUND (18–50 s)  ->  RESULTS (7 s)  ->  ...

During intermission the HUD shows the next map and disaster so you can plan your route. When the round starts you get a 5-second warning window before the disaster becomes lethal, then you have a short grace period to reach safety.

Disasters & difficulty

 Disaster Difficulty Safe zone Notes

 Acid Rain 🟢 Easy Shelter / Interior

 Lightning Storm 🟢 Easy Interior / Shelter

 Sandstorm 🟢 Easy Interior Shelters get buried

 Earthquake 🟡 Medium Open ground The only one where roofs kill you

 Tornado 🟡 Medium Interior / Shelter Physically pushes you

 Meteor Shower 🟡 Medium Interior / Shelter / Bunker

 Tsunami 🔴 Hard High ground Water climbs the map

 Volcano Eruption 🔴 Hard High ground / Bunker Lava rises

 Blizzard 🔴 Hard Interior / Shelter

 Solar Flare 🟣 Extreme Bunker / Interior

 Nuclear Bomb 🟣 Extreme Bunker only Very rare (~1.5 % + lowest weight). Bomb falls, sirens, white flash, shockwave, mushroom cloud

 Flash Flood 🔴 Hard Climb Obby map only, 100 % forced. Water never stops rising

Every arena has a shelter, an interior, a bunker, a high-ground tower and an open zone, so every disaster always has a counter-play.

Controls

 Input Action

 W A S D Move (camera-relative)

 Space Jump

 Shift Sprint

 Mouse drag Orbit camera

 Mouse wheel Zoom

 Enter Chat

Project layout

disaster-game/
├── server/
│   ├── index.js      Express + Socket.IO, auth API, chat
│   ├── game.js       Round state machine, disaster picks, survival checks
│   └── accounts.js   scrypt hashing, JSON store, HMAC sessions
├── shared/           ← imported by BOTH server and browser
│   ├── config.js     Tunables (20 s intermission, speeds, tick rates)
│   ├── maps.js       5 arenas as box data + safe zones
│   └── disasters.js  Disaster catalogue, difficulty, weighted picking
├── public/
│   ├── index.html
│   ├── styles.css
│   └── js/
│       ├── main.js     Bootstrap, loop, socket wiring
│       ├── world.js    Map -> meshes + collision boxes
│       ├── player.js   Local controller, physics, camera rig
│       ├── remote.js   Interpolated remote avatars
│       ├── effects.js  Per-disaster visuals (rain, tornado, nuke, flood…)
│       ├── ui.js       HUD, chat, feed, overlays
│       ├── audio.js    Synthesised WebAudio SFX
│       └── util.js     Label sprites, disposal helpers
└── data/             accounts.json + secret.key (created at runtime)

Why the shared folder matters

shared/ is served to the browser as static files and imported by Node. The map geometry, safe zones and disaster rules are defined exactly once, so the server's "are you safe?" check can never disagree with what the player sees.

How survival is decided

The server owns the truth. Clients only report their own position at 15 Hz.

isSafe(player) {
  if (this.disaster.rising) return player.pos.y > this.waterLevel + 0.15;
  const zones = this.map.zones.filter(z => this.disaster.safe.includes(z.type));
  return zones.some(zone => inside(player.pos, zone));
}

Stand outside the correct zone for GRACE_MS (2.5 s) and you are eliminated. Rising hazards give you only 0.7 s. Fall below the map and you are gone instantly.

Tuning

All gameplay numbers live in shared/config.js — intermission length, prep window, grace periods, movement speed, jump height, tick rates. Change them in one place and both sides update.

To change disaster odds, edit the weight field in shared/disasters.js (0 = never picked randomly). The nuclear bomb's rarity comes from both its weight and the extra rollNuclear() gate in server/game.js.
