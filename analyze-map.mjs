import { bgtiles, objmap, mapwidth, mapheight } from './gentle-map.js';

// 统计 bgTiles 中所有 tile 索引出现频率
const freq = {};
for (const layer of bgtiles) {
  for (let x = 0; x < layer.length; x++) {
    for (let y = 0; y < layer[x].length; y++) {
      const t = layer[x][y];
      if (t === -1) continue;
      freq[t] = (freq[t] || 0) + 1;
    }
  }
}
const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
console.log('Top 30 bg tile indices (index: count):');
sorted.slice(0, 30).forEach(([k, v]) => console.log(`  tile ${k}: ${v}`));
console.log(`\nTotal unique bg tiles: ${sorted.length}`);

// 检查 962 和 1007（可能是水）的区域
for (const waterTile of [962, 1007, 1010, 1055]) {
  let area = [];
  for (let x = 0; x < bgtiles[0].length; x++) {
    for (let y = 0; y < bgtiles[0][x].length; y++) {
      if (bgtiles[0][x] && bgtiles[0][x][y] === waterTile) area.push({ x, y });
    }
  }
  if (area.length > 0) {
    const xs = area.map(p => p.x), ys = area.map(p => p.y);
    console.log(`\nTile ${waterTile}: ${area.length} tiles, X: ${Math.min(...xs)}-${Math.max(...xs)}, Y: ${Math.min(...ys)}-${Math.max(...ys)}`);
  }
}

// 分析 objectTiles 碰撞层
let objBlocked = 0;
for (const layer of objmap) {
  for (let x = 0; x < layer.length; x++) {
    for (let y = 0; y < layer[x].length; y++) {
      if (layer[x][y] !== -1) objBlocked++;
    }
  }
}
console.log(`\nObject tiles blocked: ${objBlocked} out of ${mapwidth * mapheight}`);

// 分析所有水类 tile 的完整分布
// tileset 是 45 列 x 32 行，tile 962 在 row 21, col 22 附近
// 让我找所有看起来像水的 tile（通过检查它们的 tileset 位置）
const numTilesX = 45;
console.log('\nWater-like tile analysis:');
// 962 = row 21, col 22
// 1007 = row 22, col 17
// Let's check which tiles form continuous water regions
const waterTiles = new Set();
// Check all bg layers for tiles that appear in what looks like water areas
// From the map data, 962 and 1007 are clearly water
// Let's also check nearby tiles in the tileset
for (const t of [962, 1007, 1010, 1055, 908, 909, 910, 953, 954, 955, 956, 957, 958, 959, 960, 961, 963]) {
  const row = Math.floor(t / numTilesX);
  const col = t % numTilesX;
  console.log(`  Tile ${t}: tileset row=${row}, col=${col}, count=${freq[t] || 0}`);
}

// Find the river: look at the map and find continuous water regions
console.log('\n=== River location analysis ===');
// Check each column to see if it has water tiles
const waterByCol = {};
for (let x = 0; x < mapwidth; x++) {
  let count = 0;
  for (let y = 0; y < mapheight; y++) {
    for (const layer of bgtiles) {
      const t = layer[x]?.[y];
      if (t === 962 || t === 1007 || t === 1010 || t === 1055) count++;
    }
  }
  if (count > 0) waterByCol[x] = count;
}
console.log('Water by column (x: count):');
for (const [x, c] of Object.entries(waterByCol).sort((a, b) => Number(a[0]) - Number(b[0]))) {
  console.log(`  x=${x}: ${c} water tiles`);
}
