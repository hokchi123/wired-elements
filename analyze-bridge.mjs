import { bgtiles, objmap, mapwidth, mapheight } from './gentle-map.js';

const WATER_TILES = new Set([962, 957, 958, 959, 960, 961, 963, 1007, 1010, 1055, 953, 954, 955, 956]);

// Build collision map
const collisionMap = [];
for (let x = 0; x < mapwidth; x++) {
  collisionMap[x] = [];
  for (let y = 0; y < mapheight; y++) {
    let blocked = false;
    for (const layer of objmap) {
      if (layer[x] && layer[x][y] !== -1 && layer[x][y] !== undefined) { blocked = true; break; }
    }
    if (!blocked) {
      for (const layer of bgtiles) {
        if (WATER_TILES.has(layer[x]?.[y])) { blocked = true; break; }
      }
    }
    collisionMap[x][y] = blocked;
  }
}

// Check character starting positions
const positions = [
  { name: 'Lucky',  x: 20, y: 30 },
  { name: 'Bob',    x: 35, y: 25 },
  { name: 'Alice',  x: 28, y: 35 },
  { name: 'Kurt',   x: 45, y: 30 },
  { name: 'Stella', x: 50, y: 35 },
  { name: 'Pete',   x: 25, y: 40 },
];
console.log('=== Character positions ===');
positions.forEach(p => {
  const walkable = !collisionMap[p.x]?.[p.y];
  console.log(`  ${p.name}: (${p.x}, ${p.y}) walkable=${walkable}`);
});

// Analyze left river crossing points
console.log('\n=== Left river at each Y (which X tiles are water) ===');
for (let y = 5; y <= 12; y++) {
  const waterXs = [];
  for (let x = 5; x <= 15; x++) {
    for (const layer of bgtiles) {
      if (WATER_TILES.has(layer[x]?.[y])) { waterXs.push(x); break; }
    }
  }
  if (waterXs.length > 0) {
    console.log(`  y=${y}: water at x=${waterXs.join(',')} (width=${waterXs.length})`);
  }
}

// Find the narrowest crossing
console.log('\n=== Narrowest crossing point ===');
let bestY = -1, bestWidth = 999, bestXs = [];
for (let y = 5; y <= 30; y++) {
  const waterXs = [];
  for (let x = 5; x <= 16; x++) {
    for (const layer of bgtiles) {
      if (WATER_TILES.has(layer[x]?.[y])) { waterXs.push(x); break; }
    }
  }
  if (waterXs.length > 0 && waterXs.length < bestWidth) {
    bestWidth = waterXs.length;
    bestY = y;
    bestXs = waterXs;
  }
}
console.log(`  Narrowest: y=${bestY}, water x=${bestXs.join(',')}, width=${bestWidth}`);

// Also check right river
console.log('\n=== Right river at each Y ===');
for (let y = 4; y <= 15; y++) {
  const waterXs = [];
  for (let x = 40; x <= 56; x++) {
    for (const layer of bgtiles) {
      if (WATER_TILES.has(layer[x]?.[y])) { waterXs.push(x); break; }
    }
  }
  if (waterXs.length > 0) {
    console.log(`  y=${y}: water at x=${waterXs.join(',')} (width=${waterXs.length})`);
  }
}

// Find nearest walkable for each character position
console.log('\n=== Nearest walkable for each character ===');
function findNearestWalkable(x, y) {
  if (!collisionMap[x]?.[y]) return { x, y };
  for (let r = 1; r < 15; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        if (!collisionMap[x + dx]?.[y + dy]) return { x: x + dx, y: y + dy };
      }
    }
  }
  return null;
}
positions.forEach(p => {
  const safe = findNearestWalkable(p.x, p.y);
  if (safe) {
    const dist = Math.sqrt((safe.x - p.x) ** 2 + (safe.y - p.y) ** 2);
    console.log(`  ${p.name}: (${p.x},${p.y}) -> (${safe.x},${safe.y}) dist=${dist.toFixed(1)}`);
  } else {
    console.log(`  ${p.name}: (${p.x},${p.y}) -> NO WALKABLE FOUND!`);
  }
});

// Suggest good starting positions (all on land, spread out)
console.log('\n=== Suggested safe positions ===');
const candidates = [
  { x: 20, y: 30 }, { x: 30, y: 25 }, { x: 25, y: 35 },
  { x: 38, y: 30 }, { x: 55, y: 25 }, { x: 35, y: 42 },
  { x: 22, y: 20 }, { x: 40, y: 20 }, { x: 50, y: 30 },
  { x: 30, y: 40 }, { x: 55, y: 35 }, { x: 25, y: 25 },
];
candidates.forEach(c => {
  console.log(`  (${c.x}, ${c.y}): walkable=${!collisionMap[c.x]?.[c.y]}`);
});
