import { bgtiles, objmap, mapwidth, mapheight } from './gentle-map.js';

// Simulate the WATER_TILES, BRIDGE, BRIDGE2 from ai-town.js
const WATER_TILES = new Set([
  962, 957, 958, 959, 960, 961, 963,
  1007, 1010, 1055,
  953, 954, 955, 956,
]);
const BRIDGE = { y: 6, xMin: 8, xMax: 13 };
const BRIDGE2 = { y: 12, xMin: 42, xMax: 51 };

// Build collision map (same logic as ai-town.js)
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

// Apply bridge walkable
for (let x = BRIDGE.xMin; x <= BRIDGE.xMax; x++) {
  if (collisionMap[x]) collisionMap[x][BRIDGE.y] = false;
}
for (let x = BRIDGE2.xMin; x <= BRIDGE2.xMax; x++) {
  if (collisionMap[x]) collisionMap[x][BRIDGE2.y] = false;
}

// isWalkable
function isWalkable(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  if (ix < 0 || iy < 0 || ix >= mapwidth || iy >= mapheight) return false;
  return !collisionMap[ix][iy];
}

// Verify bridge 1 tiles are walkable
console.log('=== Bridge 1 (left river) ===');
console.log(`  Position: y=${BRIDGE.y}, x=${BRIDGE.xMin}-${BRIDGE.xMax}`);
for (let x = BRIDGE.xMin; x <= BRIDGE.xMax; x++) {
  const wasWater = WATER_TILES.has(bgtiles[0]?.[x]?.[BRIDGE.y]) || WATER_TILES.has(bgtiles[1]?.[x]?.[BRIDGE.y]);
  console.log(`  (${x}, ${BRIDGE.y}): walkable=${isWalkable(x, BRIDGE.y)}, wasWater=${wasWater}`);
}

// Verify bridge 2 tiles are walkable
console.log('\n=== Bridge 2 (right river) ===');
console.log(`  Position: y=${BRIDGE2.y}, x=${BRIDGE2.xMin}-${BRIDGE2.xMax}`);
for (let x = BRIDGE2.xMin; x <= BRIDGE2.xMax; x++) {
  const wasWater = WATER_TILES.has(bgtiles[0]?.[x]?.[BRIDGE2.y]) || WATER_TILES.has(bgtiles[1]?.[x]?.[BRIDGE2.y]);
  console.log(`  (${x}, ${BRIDGE2.y}): walkable=${isWalkable(x, BRIDGE2.y)}, wasWater=${wasWater}`);
}

// Verify all character starting positions
console.log('\n=== Character starting positions ===');
const positions = [
  { name: 'Lucky',  x: 20, y: 30 },
  { name: 'Bob',    x: 30, y: 25 },
  { name: 'Alice',  x: 25, y: 35 },
  { name: 'Kurt',   x: 38, y: 30 },
  { name: 'Stella', x: 55, y: 25 },
  { name: 'Pete',   x: 35, y: 42 },
];
let allSafe = true;
positions.forEach(p => {
  const walkable = isWalkable(p.x + 0.5, p.y + 0.5);
  if (!walkable) allSafe = false;
  console.log(`  ${p.name}: (${p.x}, ${p.y}) walkable=${walkable} ${walkable ? '✅' : '❌ BLOCKED!'}`);
});

// Test path across bridge: can an NPC walk from (5, 6) to (16, 6)?
console.log('\n=== Bridge crossing test (left river) ===');
let path = [];
for (let x = 5; x <= 16; x++) {
  path.push({ x, walkable: isWalkable(x + 0.5, 6.5) });
}
console.log('  Path from x=5 to x=16 at y=6:');
path.forEach(p => {
  console.log(`    x=${p.x}: ${p.walkable ? '✅' : '❌'}`);
});

// Test path across bridge 2
console.log('\n=== Bridge crossing test (right river) ===');
path = [];
for (let x = 38; x <= 55; x++) {
  path.push({ x, walkable: isWalkable(x + 0.5, 12.5) });
}
console.log('  Path from x=38 to x=55 at y=12:');
path.forEach(p => {
  console.log(`    x=${p.x}: ${p.walkable ? '✅' : '❌'}`);
});

console.log(`\n=== Summary ===`);
console.log(`  All characters start on land: ${allSafe ? '✅' : '❌'}`);
console.log(`  Bridge 1 walkable: ${isWalkable(10, 6) ? '✅' : '❌'}`);
console.log(`  Bridge 2 walkable: ${isWalkable(45, 12) ? '✅' : '❌'}`);
