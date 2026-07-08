import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const TIMEOUT = 15000;

const results = [];
function check(name, cond) {
  results.push({ name, pass: cond });
  console.log(`${cond ? '✅' : '❌'} ${name}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text());
});

await page.goto(BASE, { waitUntil: 'networkidle', timeout: TIMEOUT });
await page.waitForTimeout(4000);

// 1. No JS errors
check('无 JS 错误', errors.length === 0);
if (errors.length > 0) console.log('  Errors:', errors.slice(0, 3));

// 2. Canvas exists and has correct size
const canvasInfo = await page.evaluate(() => {
  const c = document.getElementById('aiTownCanvas');
  if (!c) return null;
  return { w: c.width, h: c.height, cw: c.clientWidth, ch: c.clientHeight };
});
check('Canvas 存在', canvasInfo !== null);
check('Canvas 宽度 > 300', canvasInfo && canvasInfo.cw > 300);
check('Canvas 高度 > 200', canvasInfo && canvasInfo.ch > 200);

// 3. AITown instance exists with 6 NPCs
const townInfo = await page.evaluate(() => {
  if (!window.aiTown) return null;
  return {
    npcCount: window.aiTown.npcs.length,
    hasCollisionMap: !!window.aiTown.collisionMap,
    bridge1Y: 6,
    bridge2Y: 12,
  };
});
check('AITown 实例存在', townInfo !== null);
check('6 个角色', townInfo && townInfo.npcCount === 6);
check('碰撞地图已构建', townInfo && townInfo.hasCollisionMap);

// 4. All NPCs start on walkable tiles
const npcPositions = await page.evaluate(() => {
  if (!window.aiTown) return null;
  return window.aiTown.npcs.map(npc => {
    const ix = Math.floor(npc.x), iy = Math.floor(npc.y);
    const walkable = !window.aiTown.collisionMap[ix]?.[iy];
    return { name: npc.name, x: npc.x, y: npc.y, ix, iy, walkable };
  });
});
if (npcPositions) {
  npcPositions.forEach(n => {
    check(`角色 ${n.name} 起始位置可行走 (${n.ix},${n.iy})`, n.walkable);
  });
}

// 5. Bridge tiles are walkable
const bridgeInfo = await page.evaluate(() => {
  if (!window.aiTown) return null;
  const b1 = [], b2 = [];
  for (let x = 8; x <= 13; x++) {
    b1.push({ x, y: 6, walkable: !window.aiTown.collisionMap[x]?.[6] });
  }
  for (let x = 42; x <= 51; x++) {
    b2.push({ x, y: 12, walkable: !window.aiTown.collisionMap[x]?.[12] });
  }
  return { b1, b2 };
});
if (bridgeInfo) {
  const b1AllWalkable = bridgeInfo.b1.every(t => t.walkable);
  const b2AllWalkable = bridgeInfo.b2.every(t => t.walkable);
  check('左河桥 (y=6, x=8-13) 全部可行走', b1AllWalkable);
  check('右河桥 (y=12, x=42-51) 全部可行走', b2AllWalkable);
}

// 6. Map canvas exists (bridge is rendered)
const mapCanvasInfo = await page.evaluate(() => {
  if (!window.aiTown || !window.aiTown.mapCanvas) return null;
  return { w: window.aiTown.mapCanvas.width, h: window.aiTown.mapCanvas.height };
});
check('地图预渲染 Canvas 存在（含桥）', mapCanvasInfo !== null);
check('地图尺寸 2048x1536', mapCanvasInfo && mapCanvasInfo.w === 2048 && mapCanvasInfo.h === 1536);

// 7. After 5 seconds, NPCs should still be on walkable tiles
await page.waitForTimeout(5000);
const npcPositionsAfter = await page.evaluate(() => {
  if (!window.aiTown) return null;
  return window.aiTown.npcs.map(npc => {
    const ix = Math.floor(npc.x), iy = Math.floor(npc.y);
    const walkable = !window.aiTown.collisionMap[ix]?.[iy];
    return { name: npc.name, x: npc.x.toFixed(1), y: npc.y.toFixed(1), ix, iy, walkable, state: npc.state };
  });
});
if (npcPositionsAfter) {
  console.log('\n--- 5秒后角色状态 ---');
  npcPositionsAfter.forEach(n => {
    check(`${n.name} 仍在可行走位置 (${n.ix},${n.iy}) state=${n.state}`, n.walkable);
  });
}

// 8. Screenshot
await page.screenshot({ path: 'screenshot-bridge-fix.png', fullPage: false });
check('截图已保存', true);

console.log(`\n=== 结果: ${results.filter(r => r.pass).length}/${results.length} 通过 ===`);

await browser.close();
process.exit(results.every(r => r.pass) ? 0 : 1);
