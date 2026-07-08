import { bgtiles, objmap, mapwidth, mapheight } from './gentle-map.js';

// 所有水相关 tile 索引
const WATER_TILES = new Set([962, 957, 958, 959, 960, 961, 963, 1007, 1010, 1055, 953, 954, 955, 956]);

// 分析两条河的精确范围
console.log('=== Left river (x=5-15) ===');
for (let x = 5; x <= 15; x++) {
  const waterYs = [];
  for (let y = 0; y < mapheight; y++) {
    for (const layer of bgtiles) {
      const t = layer[x]?.[y];
      if (WATER_TILES.has(t)) { waterYs.push(y); break; }
    }
  }
  if (waterYs.length > 0) {
    console.log(`  x=${x}: y=${Math.min(...waterYs)}-${Math.max(...waterYs)} (${waterYs.length} tiles)`);
  }
}

console.log('\n=== Right river (x=40-55) ===');
for (let x = 40; x <= 55; x++) {
  const waterYs = [];
  for (let y = 0; y < mapheight; y++) {
    for (const layer of bgtiles) {
      const t = layer[x]?.[y];
      if (WATER_TILES.has(t)) { waterYs.push(y); break; }
    }
  }
  if (waterYs.length > 0) {
    console.log(`  x=${x}: y=${Math.min(...waterYs)}-${Math.max(...waterYs)} (${waterYs.length} tiles)`);
  }
}

// 找适合建桥的位置（河最窄处）
console.log('\n=== Bridge candidates (narrowest water) ===');
for (let x = 5; x <= 55; x++) {
  const waterYs = [];
  for (let y = 0; y < mapheight; y++) {
    for (const layer of bgtiles) {
      const t = layer[x]?.[y];
      if (WATER_TILES.has(t)) { waterYs.push(y); break; }
    }
  }
  if (waterYs.length >= 3 && waterYs.length <= 8) {
    console.log(`  x=${x}: ${waterYs.length} water tiles, y=${Math.min(...waterYs)}-${Math.max(...waterYs)}`);
  }
}

// 统计碰撞情况
console.log('\n=== Collision analysis ===');
let blocked = 0, walkable = 0;
const collisionMap = [];
for (let x = 0; x < mapwidth; x++) {
  collisionMap[x] = [];
  for (let y = 0; y < mapheight; y++) {
    let isBlocked = false;
    // Check object tiles
    for (const layer of objmap) {
      if (layer[x]?.[y] !== -1 && layer[x]?.[y] !== undefined) { isBlocked = true; break; }
    }
    // Check water tiles
    if (!isBlocked) {
      for (const layer of bgtiles) {
        if (WATER_TILES.has(layer[x]?.[y])) { isBlocked = true; break; }
      }
    }
    collisionMap[x][y] = isBlocked;
    if (isBlocked) blocked++; else walkable++;
  }
}
console.log(`Blocked: ${blocked}, Walkable: ${walkable}, Total: ${mapwidth * mapheight}`);
console.log(`Walkable ratio: ${(walkable / (mapwidth * mapheight) * 100).toFixed(1)}%`);
