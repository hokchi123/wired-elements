// ============================================================
// AI 小镇 — 降级保真版 v5（碰撞 + 桥 + 6 角色 + 手绘风格）
// 基于 a16z-infra/ai-town 的角色、记忆和对话系统
// 使用原版 gentle-obj.png 贴图 + gentle.js 地图数据
// 含碰撞检测（水/障碍）、桥、6 个角色
// Canvas 内所有 UI 采用 RoughJS 手绘风格
// ============================================================

// ===== 原版地图数据 =====
import { bgtiles, objmap, tiledim, tilesetpxw, tilesetpxh, mapwidth, mapheight } from './gentle-map.js';

// ===== 水体 tile 索引集合 =====
const WATER_TILES = new Set([
  962, 957, 958, 959, 960, 961, 963,  // 左河
  1007, 1010, 1055,                      // 右河/池塘
  953, 954, 955, 956,                    // 水边
]);

// ===== 桥的位置（y=8 是两条河最宽最中心的位置） =====
// 左河桥：y=8, x=6-14（9格水体全覆盖）
const BRIDGE = { y: 8, xMin: 6, xMax: 14 };
// 右河桥：y=8, x=41-50（10格水体全覆盖）
const BRIDGE2 = { y: 8, xMin: 41, xMax: 50 };

// ===== 精灵帧定义（精确复制自原版 spritesheets） =====
const SPRITE_DATA = {
  f1: { down: { x: 0,   y: 0   }, left: { x: 0,   y: 32  }, right: { x: 0,   y: 64  }, up: { x: 0,   y: 96  } },
  f2: { down: { x: 96,  y: 0   }, left: { x: 96,  y: 32  }, right: { x: 96,  y: 64  }, up: { x: 96,  y: 96  } },
  f3: { down: { x: 192, y: 0   }, left: { x: 192, y: 32  }, right: { x: 192, y: 65  }, up: { x: 192, y: 96  } },
  f4: { down: { x: 288, y: 0   }, left: { x: 288, y: 32  }, right: { x: 288, y: 64  }, up: { x: 288, y: 96  } },
  f5: { down: { x: 0,   y: 128 }, left: { x: 0,   y: 160 }, right: { x: 0,   y: 192 }, up: { x: 0,   y: 224 } },
  f6: { down: { x: 96,  y: 128 }, left: { x: 96,  y: 160 }, right: { x: 96,  y: 192 }, up: { x: 96,  y: 224 } },
};

// ===== 6 个角色定义 =====
const CHARACTERS = [
  { name: 'Lucky',  character: 'f1', color: '#4CAF50' },
  { name: 'Bob',    character: 'f4', color: '#8D6E63' },
  { name: 'Alice',  character: 'f3', color: '#9C27B0' },
  { name: 'Kurt',   character: 'f2', color: '#2196F3' },
  { name: 'Stella', character: 'f6', color: '#FF5722' },
  { name: 'Pete',   character: 'f5', color: '#FF9800' },
];

// ===== 手绘字体 =====
const FONT_HAND = "'Patrick Hand', 'Comic Sans MS', 'Segoe UI', cursive";
const FONT_TITLE = "'Caveat', 'Patrick Hand', cursive";

// ===== 预置记忆（中文） =====
const SEED_MEMORIES = {
  Lucky: [
    { description: '我和 Bob 聊了他花园的事，很开心。', importance: 6, time: '第1天' },
    { description: '我在老橡树旁边发现了一整块奶酪！', importance: 8, time: '第1天' },
    { description: 'Alice 给我出了一个关于星星的谜语。', importance: 7, time: '第2天' },
    { description: '今天看到一只松鼠，追了它十分钟。', importance: 5, time: '第2天' },
    { description: '我给 Bob 带了番茄种子，他终于笑了。', importance: 7, time: '第3天' },
    { description: '我读完了《时间简史》，太精彩了。', importance: 6, time: '第3天' },
    { description: 'Alice 和我讨论了量子力学的问题。', importance: 8, time: '第4天' },
    { description: '我给大家做了一道奶酪料理。', importance: 6, time: '第4天' },
    { description: '昨晚我梦见自己去了火星。', importance: 4, time: '第5天' },
    { description: '今天给 Bob 讲了个关于树的笑话。', importance: 5, time: '第5天' },
  ],
  Bob: [
    { description: 'Lucky 又在不停地说奶酪的事了。', importance: 5, time: '第1天' },
    { description: '今天种了新的番茄苗。', importance: 6, time: '第1天' },
    { description: 'Alice 来问我土壤的成分。', importance: 7, time: '第2天' },
    { description: '我在老橡树上发现了一种罕见的苔藓。', importance: 7, time: '第2天' },
    { description: 'Lucky 给我带了番茄种子，挺贴心的。', importance: 8, time: '第3天' },
    { description: '今天修剪了苹果树。', importance: 6, time: '第3天' },
    { description: '我听到 Alice 给 Lucky 讲光合作用。', importance: 5, time: '第4天' },
    { description: 'Lucky 做的奶酪料理居然还挺好吃。', importance: 7, time: '第4天' },
    { description: '黎明时有一只鹿来到了我的花园。', importance: 6, time: '第5天' },
    { description: '有时候我在想，如果当初上了大学会怎样。', importance: 8, time: '第5天' },
  ],
  Alice: [
    { description: '我给 Lucky 讲了我的暗物质理论。', importance: 7, time: '第1天' },
    { description: '昨晚的星星格外明亮。', importance: 8, time: '第1天' },
    { description: '我给 Lucky 出了个谜语，他到现在还没猜出来。', importance: 5, time: '第2天' },
    { description: 'Bob 的花园里土壤微生物群落出奇地丰富。', importance: 7, time: '第2天' },
    { description: '今天统一场论有了重大突破！', importance: 9, time: '第3天' },
    { description: '我试着给 Bob 解释量子纠缠。', importance: 5, time: '第3天' },
    { description: 'Lucky 和我讨论了多元宇宙，非常精彩。', importance: 8, time: '第4天' },
    { description: '我在森林附近观察到了异常的光线模式。', importance: 8, time: '第4天' },
    { description: '我意识到关于地平线的谜语其实是我搞错了。', importance: 6, time: '第5天' },
    { description: '宇宙今天对我说话了，它说："继续寻找吧。"', importance: 9, time: '第5天' },
  ],
  Kurt: [
    { description: '今天给 Lucky 讲了关于古罗马水道桥的冷知识。', importance: 6, time: '第1天' },
    { description: '我发现这座桥的建筑结构和宋代的赵州桥很相似。', importance: 7, time: '第1天' },
    { description: 'Bob 问我树为什么是绿色的，我解释了叶绿素。', importance: 5, time: '第2天' },
    { description: '读了一篇关于量子计算最新进展的论文。', importance: 8, time: '第2天' },
    { description: '给 Alice 分享了关于费马大定理的历史。', importance: 7, time: '第3天' },
    { description: '今天学了一个有趣的事实：章鱼有三颗心脏。', importance: 5, time: '第3天' },
    { description: '和 Pete 讨论了中世纪的修道院文化。', importance: 6, time: '第4天' },
    { description: '解释了为什么天空是蓝色的——瑞利散射。', importance: 5, time: '第4天' },
    { description: 'Stella 试图骗我买什么投资产品，没得逞。', importance: 7, time: '第5天' },
    { description: '今天整理了我的知识卡片，共 1247 张。', importance: 4, time: '第5天' },
  ],
  Stella: [
    { description: '今天试图说服 Pete 投资我的"新项目"。', importance: 7, time: '第1天' },
    { description: 'Lucky 太好骗了，他真的相信我认识名人。', importance: 6, time: '第1天' },
    { description: 'Bob 根本不理我，真无趣。', importance: 4, time: '第2天' },
    { description: '给 Alice 看了我的"专利证书"，她似乎没信。', importance: 6, time: '第2天' },
    { description: '今天差点说漏嘴了自己的真实身份。', importance: 8, time: '第3天' },
    { description: 'Kurt 居然能识破我的投资骗局，聪明人。', importance: 7, time: '第3天' },
    { description: '发现 Pete 很容易被宗教话题吸引注意力。', importance: 5, time: '第4天' },
    { description: '今天的笑容练习进行了 30 分钟。', importance: 3, time: '第4天' },
    { description: '我其实挺羡慕 Lucky 的单纯和快乐。', importance: 8, time: '第5天' },
    { description: '也许有一天我会改变……但不是今天。', importance: 7, time: '第5天' },
  ],
  Pete: [
    { description: '今天在桥头祈祷了半小时，感觉内心平静。', importance: 7, time: '第1天' },
    { description: '给 Lucky 讲了诺亚方舟的故事。', importance: 5, time: '第1天' },
    { description: 'Bob 的花园让我想到了伊甸园。', importance: 6, time: '第2天' },
    { description: 'Alice 说的宇宙理论让我感到敬畏。', importance: 7, time: '第2天' },
    { description: 'Stella 总是试图让我投资什么，我要为她祈祷。', importance: 6, time: '第3天' },
    { description: '在河边冥想时看到了一只白鹭，这是好兆头。', importance: 7, time: '第3天' },
    { description: 'Kurt 告诉我中世纪修道院的事，很受启发。', importance: 6, time: '第4天' },
    { description: '今天的日落像是上帝的画布。', importance: 5, time: '第4天' },
    { description: '我为大家祈祷了，包括 Stella。', importance: 6, time: '第5天' },
    { description: '也许信仰就是走过这座桥的勇气。', importance: 8, time: '第5天' },
  ],
};

// ===== 对话模板（中文） =====
const DIALOGUE_TEMPLATES = {
  Lucky: [
    '嘿 {target}！你猜怎么着？我今天找到了超棒的奶酪！',
    '我昨晚在看关于黑洞的书，太神奇了！',
    '你看到附近的松鼠了吗？',
    '人生苦短，别那么严肃嘛。来点奶酪？',
    '我做了一个关于火星的梦，太疯狂了！',
    '{target}，你觉得宇宙的尽头是什么？',
    '我今天在老橡树下面发现了一朵奇怪的蘑菇。',
  ],
  Bob: [
    '……哦，是你啊。我正在修剪树木。',
    '能快点吗？我的番茄还等着浇水呢。',
    '现在没人欣赏一个打理良好的花园了。',
    '橡树可以活两百年。不过没人关心这个。',
    '有时候我在想……算了，无所谓了。',
    '你又来了？我刚好想一个人待着。',
    '别踩我的花。那边，小心点。',
  ],
  Alice: [
    '啊，{target}。我刚才在观察光线模式。',
    '告诉我：一个想法和一段记忆之间存在着什么？',
    '宇宙是一个被方程式包裹的谜语。',
    '我今天有了一个突破——常数不是恒定的。',
    '你看到那颗星了吗？它在千年前就已死去。',
    '时间和空间不过是同一枚硬币的两面。',
    '我昨晚梦到了一个公式，醒来就忘了。',
  ],
  Kurt: [
    '{target}，你知道吗？这座桥的结构和古罗马水道桥如出一辙。',
    '今天学到一个冷知识：蜜蜂能辨认人类的脸。',
    '量子纠缠就像两个人跨越银河的心灵感应。',
    '费马大定理困扰了数学家 358 年才被证明。',
    '你知道吗，章鱼有三颗心脏和蓝色的血液。',
    '瑞利散射解释了天空为什么是蓝色的。',
    '{target}，中世纪的修道院其实是当时的知识中心。',
  ],
  Stella: [
    '{target}～你有没有想过投资点什么？我有个好机会。',
    '说真的，我认识很多名人，改天介绍你认识。',
    '你信不信，我上个项目翻了三倍呢。',
    '今天天气真好，适合……谈合作？',
    '别听 Kurt 的，他太较真了。生活要灵活嘛。',
    '你看起来很聪明，我们应该多聊聊。',
    '{target}，你觉得钱和快乐哪个更重要？',
  ],
  Pete: [
    '{target}，今天的日落是不是很美？这是造物主的恩赐。',
    '我在桥头祈祷的时候，感受到了前所未有的平静。',
    '你知道吗？诺亚方舟的故事告诉我们，希望永远在。',
    'Bob 的花园让我想到了伊甸园。',
    '我为你祈祷了，{target}。愿光照亮你的路。',
    '有时候信仰就是走过那座桥的勇气。',
    '宇宙的浩瀚让我更加敬畏造物主。',
  ],
};

// ===== 剧情事件（中文） =====
const STORY_EVENTS = [
  '{char1} 和 {char2} 在老橡树旁进行了一场激烈的辩论。',
  '{char1} 在河边发现了不寻常的东西，告诉了 {char2}。',
  '{char2} 和 {char1} 一起看着日落，分享了食物。',
  '{char1} 陷入了沉思，{char2} 试图把他拉回现实。',
  '天空中出现了一道神秘的光，{char1} 和 {char2} 都看到了。',
  '{char1} 帮 {char2} 打理了花园。',
  '{char1} 讲了一个冷笑话，{char2} 假装没听到。',
  '{char1} 和 {char2} 静静地坐着，看萤火虫飞舞。',
  '{char1} 和 {char2} 在桥上相遇，聊了一会儿。',
  '{char2} 给 {char1} 看了自己种的稀有植物。',
  '{char1} 差点掉进河里，{char2} 及时拉住了他。',
  '{char1} 和 {char2} 在篝火旁聊到了深夜。',
];

// ===== 记忆模板（中文） =====
const MEMORY_TEMPLATES = {
  Lucky: '今天和 {partner} 聊了天，很有趣。',
  Bob: '{partner} 又来打扰我种树了。',
  Alice: '和 {partner} 的对话揭示了一些新的模式。',
  Kurt: '今天和 {partner} 分享了一些有趣的知识。',
  Stella: '今天和 {partner} 聊了聊，在评估她的利用价值。',
  Pete: '今天为 {partner} 祈祷了。',
};

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================
// 手绘风格 Canvas 渲染辅助
// ============================================================
class SketchRenderer {
  constructor() {
    this.jitterRng = mulberry32(Date.now() & 0xffffffff);
    this._jitterCache = [];
    for (let i = 0; i < 2000; i++) this._jitterCache.push((this.jitterRng() - 0.5) * 2);
    this._jitterIdx = 0;
  }
  nextJitter() { const v = this._jitterCache[this._jitterIdx]; this._jitterIdx = (this._jitterIdx + 1) % this._jitterCache.length; return v; }
  resetFrame() { this._jitterIdx = 0; }
  roughRect(ctx, x, y, w, h, options = {}) {
    const fill = options.fill, stroke = options.stroke, lineWidth = options.lineWidth || 1.5, j = options.jitter !== undefined ? options.jitter : 1.2;
    if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
    if (stroke) {
      ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + this.nextJitter() * j, y + this.nextJitter() * j); ctx.lineTo(x + w + this.nextJitter() * j, y + this.nextJitter() * j); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + w + this.nextJitter() * j, y + this.nextJitter() * j); ctx.lineTo(x + w + this.nextJitter() * j, y + h + this.nextJitter() * j); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + w + this.nextJitter() * j, y + h + this.nextJitter() * j); ctx.lineTo(x + this.nextJitter() * j, y + h + this.nextJitter() * j); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + this.nextJitter() * j, y + h + this.nextJitter() * j); ctx.lineTo(x + this.nextJitter() * j, y + this.nextJitter() * j); ctx.stroke();
    }
  }
  roughRoundRect(ctx, x, y, w, h, r, options = {}) {
    const fill = options.fill, stroke = options.stroke, lineWidth = options.lineWidth || 1.5, j = options.jitter !== undefined ? options.jitter : 1.0;
    if (fill) { ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill(); }
    if (stroke) {
      ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const segs = 40; ctx.beginPath();
      for (let i = 0; i <= segs; i++) {
        const t = i / segs, angle = t * Math.PI * 2 - Math.PI / 2;
        const mx = x + w / 2, my = y + h / 2;
        const signX = Math.cos(angle) > 0 ? 1 : -1, signY = Math.sin(angle) > 0 ? 1 : -1;
        const px = mx + signX * Math.min(Math.abs(Math.cos(angle)) * w / 2, w / 2 - r) + (Math.abs(Math.cos(angle)) > (w/2-r)/(w/2) ? signX * r * Math.cos(angle) / Math.abs(Math.cos(angle)) : 0);
        const py = my + signY * Math.min(Math.abs(Math.sin(angle)) * h / 2, h / 2 - r) + (Math.abs(Math.sin(angle)) > (h/2-r)/(h/2) ? signY * r * Math.sin(angle) / Math.abs(Math.sin(angle)) : 0);
        if (i === 0) ctx.moveTo(px + this.nextJitter() * j, py + this.nextJitter() * j);
        else ctx.lineTo(px + this.nextJitter() * j, py + this.nextJitter() * j);
      }
      ctx.stroke();
    }
  }
  roughEllipse(ctx, cx, cy, rx, ry, options = {}) {
    const fill = options.fill || 'rgba(0,0,0,0.25)', j = options.jitter !== undefined ? options.jitter : 0.6;
    ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    if (options.stroke) {
      ctx.strokeStyle = options.stroke; ctx.lineWidth = options.lineWidth || 1;
      const segs = 24; ctx.beginPath();
      for (let i = 0; i <= segs; i++) { const a = (i / segs) * Math.PI * 2; const px = cx + Math.cos(a) * rx + this.nextJitter() * j, py = cy + Math.sin(a) * ry + this.nextJitter() * j; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.stroke();
    }
  }
  roughDashedLine(ctx, x1, y1, x2, y2, options = {}) {
    const dashLen = options.dashLen || 8, gapLen = options.gapLen || 6, stroke = options.stroke || '#ccc', j = options.jitter !== undefined ? options.jitter : 0.8;
    ctx.strokeStyle = stroke; ctx.lineWidth = options.lineWidth || 1.5; ctx.lineCap = 'round';
    const dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy), nx = dx / len, ny = dy / len;
    let pos = 0, draw = true;
    while (pos < len) {
      const end = Math.min(pos + (draw ? dashLen : gapLen), len);
      if (draw) { ctx.beginPath(); ctx.moveTo(x1 + nx * pos + this.nextJitter() * j, y1 + ny * pos + this.nextJitter() * j); ctx.lineTo(x1 + nx * end + this.nextJitter() * j, y1 + ny * end + this.nextJitter() * j); ctx.stroke(); }
      pos = end; draw = !draw;
    }
  }
}

// ============================================================
// AI 小镇主类
// ============================================================
class AITown {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.sketch = new SketchRenderer();

    this.tileDim = tiledim || 32;
    this.tileSetPxW = tilesetpxw || 1440;
    this.tileSetPxH = tilesetpxh || 1024;
    this.mapCols = mapwidth || 64;
    this.mapRows = mapheight || 48;
    this.bgTiles = bgtiles;
    this.objTiles = objmap;
    this.numTilesX = Math.floor(this.tileSetPxW / this.tileDim);
    this.numTilesY = Math.floor(this.tileSetPxH / this.tileDim);

    this.npcScale = options.npcScale || 1.5;
    this.bgOpacity = options.opacity || 0.95;

    // 相机平移（左键拖动）
    this.panX = 0;
    this.panY = 0;

    this.npcs = [];
    this.memories = {};
    this.storyLog = [];
    this.dayCount = 1;
    this.dayStartTime = Date.now();
    this.dayDuration = 60000;
    this.lastStoryTime = Date.now();
    this.storyInterval = 15000;

    this.tilesetImg = null;
    this.spriteImg = null;
    this.rng = mulberry32(options.seed || 42);
    this.running = false;
    this.bubbles = [];
    this.particles = [];
    this.mapCanvas = null;

    this._visibleBounds = { xMin: 0, xMax: this.mapCols, yMin: 0, yMax: this.mapRows };

    // 碰撞地图
    this.collisionMap = null;

    this.init();
  }

  init() {
    // 构建碰撞地图
    this.buildCollisionMap();

    // 创建 6 个角色 —— 全部在已验证的可行走位置
    const positions = [
      { x: 20, y: 30 }, { x: 30, y: 25 }, { x: 25, y: 35 },
      { x: 38, y: 30 }, { x: 55, y: 25 }, { x: 35, y: 42 },
    ];
    this.npcs = CHARACTERS.map((char, i) => {
      const pos = positions[i];
      // 确保起始位置可行走
      const safe = this.findNearestWalkable(pos.x, pos.y);
      return {
        ...char,
        x: safe.x + this.rng() * 0.5,
        y: safe.y + this.rng() * 0.5,
        tx: safe.x, ty: safe.y,
        dir: 'down', frame: 0, frameTime: 0,
        speed: 0.75 + this.rng() * 0.3,
        state: 'wander', stateTimer: 0,
        partner: null, talkCooldown: 0,
      };
    });

    CHARACTERS.forEach(char => {
      this.memories[char.name] = [...SEED_MEMORIES[char.name]];
    });

    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: this.rng() * this.mapCols, y: this.rng() * this.mapRows,
        vx: (this.rng() - 0.5) * 0.015, vy: (this.rng() - 0.5) * 0.015,
        phase: this.rng() * Math.PI * 2, size: 1 + this.rng() * 2,
      });
    }

    this.generateStory();
  }

  // ===== 构建碰撞地图 =====
  buildCollisionMap() {
    const w = this.mapCols, h = this.mapRows;
    this.collisionMap = [];
    for (let x = 0; x < w; x++) {
      this.collisionMap[x] = [];
      for (let y = 0; y < h; y++) {
        let blocked = false;
        // 检查对象层
        for (const layer of this.objTiles) {
          if (layer[x] && layer[x][y] !== -1 && layer[x][y] !== undefined) { blocked = true; break; }
        }
        // 检查水 tile
        if (!blocked) {
          for (const layer of this.bgTiles) {
            if (WATER_TILES.has(layer[x]?.[y])) { blocked = true; break; }
          }
        }
        this.collisionMap[x][y] = blocked;
      }
    }

    // 桥1位置设为可行走（左河，水平桥）
    for (let x = BRIDGE.xMin; x <= BRIDGE.xMax; x++) {
      if (this.collisionMap[x]) this.collisionMap[x][BRIDGE.y] = false;
    }
    // 桥2位置设为可行走（右河，水平桥）
    for (let x = BRIDGE2.xMin; x <= BRIDGE2.xMax; x++) {
      if (this.collisionMap[x]) this.collisionMap[x][BRIDGE2.y] = false;
    }
  }

  // 检查某个 tile 位置是否可行走
  isWalkable(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    if (ix < 0 || iy < 0 || ix >= this.mapCols || iy >= this.mapRows) return false;
    return !this.collisionMap[ix][iy];
  }

  // 找最近的可行走位置
  findNearestWalkable(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    if (this.isWalkable(ix, iy)) return { x: ix + 0.5, y: iy + 0.5 };
    // 螺旋搜索（扩大搜索半径到 20）
    for (let r = 1; r < 20; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          if (this.isWalkable(ix + dx, iy + dy)) return { x: ix + dx + 0.5, y: iy + dy + 0.5 };
        }
      }
    }
    return { x: 30, y: 30 }; // 后备
  }

  loadTileset(img) { this.tilesetImg = img; this.prerenderMap(); }
  loadSprite(img) { this.spriteImg = img; }

  // ===== 预渲染地图（含扩展场景） =====
  prerenderMap() {
    if (!this.tilesetImg || !this.tilesetImg.complete) return;
    const ts = this.tileDim;
    const margin = 40;
    this.extMargin = margin;
    const extCols = this.mapCols + margin * 2;
    const extRows = this.mapRows + margin * 2;
    const extPxW = extCols * ts;
    const extPxH = extRows * ts;

    this.mapCanvas = document.createElement('canvas');
    this.mapCanvas.width = extPxW;
    this.mapCanvas.height = extPxH;
    const mctx = this.mapCanvas.getContext('2d');
    mctx.imageSmoothingEnabled = false;

    const mapOffX = margin * ts;
    const mapOffY = margin * ts;
    const mapPxW = this.mapCols * ts;
    const mapPxH = this.mapRows * ts;
    const extRng = mulberry32(98765);
    const isInOriginal = (px, py) =>
      px >= mapOffX && px < mapOffX + mapPxW && py >= mapOffY && py < mapOffY + mapPxH;

    // ===== 1. 扩展区：纯色草地底 + 微妙色斑 =====
    // 不用 tileset 贴图，避免歪七扭八
    const greens = ['#2d4a2b', '#335033', '#2a4628', '#365838', '#2e4c2c'];
    for (let x = 0; x < extCols; x++) {
      for (let y = 0; y < extRows; y++) {
        const px = x * ts, py = y * ts;
        if (isInOriginal(px, py)) continue;
        mctx.fillStyle = greens[Math.floor(extRng() * greens.length)];
        mctx.fillRect(px, py, ts, ts);
      }
    }

    // ===== 2. 扩展区：矢量装饰（树、池塘、花、路） =====
    // 2a. 树（圆形树冠 + 树干）
    for (let i = 0; i < 200; i++) {
      const cx = extRng() * extPxW;
      const cy = extRng() * extPxH;
      if (isInOriginal(cx, cy)) continue;
      const r = 8 + extRng() * 10;
      // 树冠
      mctx.fillStyle = ['#1a3a1a', '#234423', '#1e3e1e'][Math.floor(extRng() * 3)];
      mctx.beginPath();
      mctx.arc(cx, cy, r, 0, Math.PI * 2);
      mctx.fill();
      // 高光
      mctx.fillStyle = 'rgba(80,140,60,0.4)';
      mctx.beginPath();
      mctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.5, 0, Math.PI * 2);
      mctx.fill();
    }

    // 2b. 池塘
    for (let i = 0; i < 20; i++) {
      const cx = extRng() * extPxW;
      const cy = extRng() * extPxH;
      if (isInOriginal(cx, cy)) continue;
      const pw = 25 + extRng() * 50;
      const ph = 20 + extRng() * 40;
      mctx.fillStyle = '#2a4f6e';
      mctx.beginPath();
      mctx.ellipse(cx, cy, pw, ph, extRng() * Math.PI, 0, Math.PI * 2);
      mctx.fill();
      mctx.fillStyle = '#3a6b8a';
      mctx.beginPath();
      mctx.ellipse(cx, cy, pw * 0.8, ph * 0.8, 0, 0, Math.PI * 2);
      mctx.fill();
    }

    // 2c. 小路
    mctx.strokeStyle = '#8B7355';
    mctx.lineWidth = 8;
    mctx.lineCap = 'round';
    const paths = [
      [mapOffX, mapOffY + mapPxH * 0.3, mapOffX - 400, mapOffY + mapPxH * 0.3 - 100],
      [mapOffX + mapPxW, mapOffY + mapPxH * 0.5, mapOffX + mapPxW + 500, mapOffY + mapPxH * 0.5 + 150],
      [mapOffX + mapPxW * 0.3, mapOffY, mapOffX + mapPxW * 0.3 - 200, mapOffY - 400],
      [mapOffX + mapPxW * 0.7, mapOffY + mapPxH, mapOffX + mapPxW * 0.7 + 300, mapOffY + mapPxH + 400],
    ];
    for (const [x1, y1, x2, y2] of paths) {
      const mx = (x1 + x2) / 2 + (extRng() - 0.5) * 200;
      const my = (y1 + y2) / 2 + (extRng() - 0.5) * 200;
      mctx.beginPath();
      mctx.moveTo(x1, y1);
      mctx.quadraticCurveTo(mx, my, x2, y2);
      mctx.stroke();
      mctx.strokeStyle = '#A0826D';
      mctx.lineWidth = 5;
      mctx.stroke();
      mctx.strokeStyle = '#8B7355';
      mctx.lineWidth = 8;
    }

    // 2d. 灌木和小花
    for (let i = 0; i < 500; i++) {
      const x = extRng() * extPxW;
      const y = extRng() * extPxH;
      if (isInOriginal(x, y)) continue;
      mctx.fillStyle = ['#4a7a2a', '#5a8a3a', '#3a6a1a'][Math.floor(extRng() * 3)];
      mctx.beginPath();
      mctx.arc(x, y, 2 + extRng() * 3, 0, Math.PI * 2);
      mctx.fill();
    }
    for (let i = 0; i < 150; i++) {
      const x = extRng() * extPxW;
      const y = extRng() * extPxH;
      if (isInOriginal(x, y)) continue;
      mctx.fillStyle = ['#FFD700', '#FF69B4', '#FF6347', '#9370DB'][Math.floor(extRng() * 4)];
      mctx.beginPath();
      mctx.arc(x, y, 1.5 + extRng() * 1.5, 0, Math.PI * 2);
      mctx.fill();
    }

    // ===== 3. 渲染原始地图在中心 =====
    // 先画背景层
    for (const layer of this.bgTiles) {
      if (!layer) continue;
      for (let x = 0; x < layer.length; x++) {
        const col = layer[x];
        if (!col) continue;
        for (let y = 0; y < col.length; y++) {
          const tileIdx = col[y];
          if (tileIdx === -1 || tileIdx === undefined || tileIdx === null) continue;
          const sx = (tileIdx % this.numTilesX) * ts;
          const sy = Math.floor(tileIdx / this.numTilesX) * ts;
          mctx.drawImage(this.tilesetImg, sx, sy, ts, ts, mapOffX + x * ts, mapOffY + y * ts, ts, ts);
        }
      }
    }

    // 再画对象层，但跳过桥位置（避免桥下面有帐篷/装饰物）
    const isBridgeTile = (x, y) =>
      (y === BRIDGE.y && x >= BRIDGE.xMin && x <= BRIDGE.xMax) ||
      (y === BRIDGE2.y && x >= BRIDGE2.xMin && x <= BRIDGE2.xMax);
    for (const layer of this.objTiles) {
      if (!layer) continue;
      for (let x = 0; x < layer.length; x++) {
        const col = layer[x];
        if (!col) continue;
        for (let y = 0; y < col.length; y++) {
          if (isBridgeTile(x, y)) continue; // 桥位置不画对象层
          const tileIdx = col[y];
          if (tileIdx === -1 || tileIdx === undefined || tileIdx === null) continue;
          const sx = (tileIdx % this.numTilesX) * ts;
          const sy = Math.floor(tileIdx / this.numTilesX) * ts;
          mctx.drawImage(this.tilesetImg, sx, sy, ts, ts, mapOffX + x * ts, mapOffY + y * ts, ts, ts);
        }
      }
    }

    // ===== 4. 在桥位置画水色底（确保桥看起来在水上） =====
    // 因为水体 tile 962 中心像素是绿色（水边过渡 tile），
    // 需要覆盖一层水色让桥视觉上在水上
    const paintWaterUnder = (bridge) => {
      // 覆盖 y-1 到 y+1 的范围，确保水面连续
      for (let y = bridge.y - 1; y <= bridge.y + 1; y++) {
        for (let x = bridge.xMin - 1; x <= bridge.xMax + 1; x++) {
          if (x < 0 || x >= this.mapCols || y < 0 || y >= this.mapRows) continue;
          mctx.fillStyle = '#1a3e54';
          mctx.fillRect(mapOffX + x * ts, mapOffY + y * ts, ts, ts);
          // 水面高光
          mctx.fillStyle = 'rgba(40,90,120,0.5)';
          mctx.fillRect(mapOffX + x * ts + 4, mapOffY + y * ts + 4, ts - 8, ts - 8);
        }
      }
    };
    paintWaterUnder(BRIDGE);
    paintWaterUnder(BRIDGE2);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }
  stop() { this.running = false; }

  loop = () => {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.update(dt);
    this.render();
    requestAnimationFrame(this.loop);
  };

  update(dt) {
    const now = Date.now();
    if (now - this.dayStartTime > this.dayDuration) {
      this.dayCount++;
      this.dayStartTime = now;
      this.generateStory();
    }
    if (now - this.lastStoryTime > this.storyInterval) {
      this.lastStoryTime = now;
      this.generateStory();
    }

    this.npcs.forEach(npc => {
      npc.frameTime += dt;
      if (npc.frameTime > 0.25) { npc.frame = (npc.frame + 1) % 3; npc.frameTime = 0; }
      npc.stateTimer += dt;
      if (npc.talkCooldown > 0) npc.talkCooldown -= dt;

      switch (npc.state) {
        case 'wander': this.updateWander(npc, dt); break;
        case 'walk_to': this.updateWalkTo(npc, dt); break;
        case 'talk': this.updateTalk(npc, dt); break;
        case 'idle':
          if (npc.stateTimer > 2 + this.rng() * 3) {
            npc.state = 'wander'; this.pickNewDestination(npc); npc.stateTimer = 0;
          }
          break;
      }
      if (npc.state === 'wander' && npc.talkCooldown <= 0 && this.rng() < 0.004) {
        this.tryStartConversation(npc);
      }
    });

    this.bubbles = this.bubbles.filter(b => { b.life -= dt; return b.life > 0; });
    this.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.phase += dt * 2;
      if (p.x < 0 || p.x > this.mapCols) p.vx *= -1;
      if (p.y < 0 || p.y > this.mapRows) p.vy *= -1;
    });
  }

  updateWander(npc, dt) {
    const dx = npc.tx - npc.x, dy = npc.ty - npc.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.3) { npc.state = 'idle'; npc.stateTimer = 0; return; }
    this.moveNpc(npc, dx / dist, dy / dist, dt);
  }

  updateWalkTo(npc, dt) {
    const dx = npc.tx - npc.x, dy = npc.ty - npc.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.5) {
      if (npc.partner && npc.partner.state === 'walk_to') {
        npc.state = 'talk'; npc.partner.state = 'talk';
        npc.stateTimer = 0; npc.partner.stateTimer = 0;
        this.startConversation(npc, npc.partner);
      } else {
        npc.state = 'wander'; this.pickNewDestination(npc);
      }
      return;
    }
    this.moveNpc(npc, dx / dist, dy / dist, dt);
  }

  updateTalk(npc, dt) {
    if (npc.stateTimer > 4 + this.rng() * 3) {
      npc.state = 'wander'; npc.talkCooldown = 10;
      this.pickNewDestination(npc); npc.stateTimer = 0;
      if (npc.partner) {
        const partner = npc.partner;
        partner.state = 'wander'; partner.talkCooldown = 10;
        this.pickNewDestination(partner); partner.stateTimer = 0;
        this.recordMemory(npc, partner);
        this.recordMemory(partner, npc);
        npc.partner = null; partner.partner = null;
      }
    }
  }

  // ===== 带碰撞检测的移动 =====
  moveNpc(npc, dirX, dirY, dt) {
    // 安全检查：如果角色当前在不可行走位置（如水中），立即拉回陆地
    if (!this.isWalkable(npc.x, npc.y)) {
      const safe = this.findNearestWalkable(npc.x, npc.y);
      npc.x = safe.x; npc.y = safe.y;
      this.pickNewDestination(npc);
      return;
    }

    const speed = npc.speed * dt;
    const newX = npc.x + dirX * speed;
    const newY = npc.y + dirY * speed;

    // 限制在可视区域内
    const b = this._visibleBounds;
    const margin = 1;

    let movedX = false, movedY = false;

    // 尝试 X 方向移动
    if (this.isWalkable(newX, npc.y)) {
      npc.x = Math.max(b.xMin + margin, Math.min(b.xMax - margin, newX));
      movedX = true;
    }

    // 尝试 Y 方向移动
    if (this.isWalkable(npc.x, newY)) {
      npc.y = Math.max(b.yMin + margin, Math.min(b.yMax - margin, newY));
      movedY = true;
    }

    // 如果两个方向都无法移动，立即选择新目标
    if (!movedX && !movedY) {
      if (npc.state === 'wander' || npc.state === 'walk_to') {
        npc.state = 'wander';
        this.pickNewDestination(npc);
        npc.stateTimer = 0;
      }
    }

    if (Math.abs(dirX) > Math.abs(dirY)) npc.dir = dirX > 0 ? 'right' : 'left';
    else npc.dir = dirY > 0 ? 'down' : 'up';
  }

  // ===== 选择可行走的目标 =====
  pickNewDestination(npc) {
    const b = this._visibleBounds;
    const margin = 2;
    for (let attempts = 0; attempts < 20; attempts++) {
      const tx = b.xMin + margin + this.rng() * (b.xMax - b.xMin - margin * 2);
      const ty = b.yMin + margin + this.rng() * (b.yMax - b.yMin - margin * 2);
      if (this.isWalkable(tx, ty)) {
        npc.tx = tx; npc.ty = ty;
        return;
      }
    }
    // 后备：当前位置附近
    npc.tx = npc.x; npc.ty = npc.y;
  }

  tryStartConversation(npc) {
    let closest = null, closestDist = 5;
    for (const other of this.npcs) {
      if (other === npc) continue;
      if (other.state !== 'wander' && other.state !== 'idle') continue;
      if (other.talkCooldown > 0) continue;
      const dist = Math.sqrt((npc.x - other.x) ** 2 + (npc.y - other.y) ** 2);
      if (dist < closestDist) { closest = other; closestDist = dist; }
    }
    if (closest) {
      // Bob 和 Pete 更喜欢独处
      if ((closest.name === 'Bob' || closest.name === 'Pete') && this.rng() < 0.35) return;
      // Stella 不会主动找 Bob
      if (npc.name === 'Stella' && closest.name === 'Bob') return;
      const midX = (npc.x + closest.x) / 2;
      const midY = (npc.y + closest.y) / 2;
      // 确保汇合点可行走
      const safe = this.findNearestWalkable(midX, midY);
      npc.state = 'walk_to'; npc.tx = safe.x + (this.rng() - 0.5) * 0.5;
      npc.ty = safe.y + (this.rng() - 0.5) * 0.5; npc.partner = closest;
      closest.state = 'walk_to'; closest.tx = safe.x + (this.rng() - 0.5) * 0.5;
      closest.ty = safe.y + (this.rng() - 0.5) * 0.5; closest.partner = npc;
    }
  }

  startConversation(npcA, npcB) {
    const lines = DIALOGUE_TEMPLATES[npcA.name] || [];
    if (lines.length > 0) {
      const line = lines[Math.floor(this.rng() * lines.length)].replace('{target}', npcB.name);
      this.bubbles.push({ npc: npcA, text: line, life: 4, maxLife: 4 });
    }
    setTimeout(() => {
      if (!this.running) return;
      const replyLines = DIALOGUE_TEMPLATES[npcB.name] || [];
      if (replyLines.length > 0) {
        const line = replyLines[Math.floor(this.rng() * replyLines.length)].replace('{target}', npcA.name);
        this.bubbles.push({ npc: npcB, text: line, life: 4, maxLife: 4 });
      }
    }, 1800);
  }

  recordMemory(npc, partner) {
    const template = MEMORY_TEMPLATES[npc.name] || '今天和 {partner} 聊了天。';
    const description = template.replace('{partner}', partner.name) + `（第${this.dayCount}天）`;
    this.memories[npc.name].push({ description, importance: 5 + Math.floor(this.rng() * 5), time: `第${this.dayCount}天` });
    if (this.memories[npc.name].length > 30) this.memories[npc.name].shift();
  }

  generateStory() {
    if (this.npcs.length < 2) return;
    const idx1 = Math.floor(this.rng() * this.npcs.length);
    let idx2 = Math.floor(this.rng() * (this.npcs.length - 1));
    if (idx2 >= idx1) idx2++;
    const template = STORY_EVENTS[Math.floor(this.rng() * STORY_EVENTS.length)];
    const story = template.replace('{char1}', this.npcs[idx1].name).replace('{char2}', this.npcs[idx2].name);
    this.storyLog.push({ day: this.dayCount, text: story, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) });
    if (this.storyLog.length > 20) this.storyLog.shift();
  }

  computeVisibleBounds(scale, offX, offY) {
    const ts = this.tileDim;
    const w = this.canvas.width, h = this.canvas.height;
    this._visibleBounds = {
      xMin: Math.max(0, (0 - offX) / (ts * scale)),
      xMax: Math.min(this.mapCols, (w - offX) / (ts * scale)),
      yMin: Math.max(0, (0 - offY) / (ts * scale)),
      yMax: Math.min(this.mapRows, (h - offY) / (ts * scale)),
    };
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width, h = this.canvas.height, ts = this.tileDim;
    this.sketch.resetFrame();

    // 1. 背景地图
    let scale, offX, offY;
    if (this.mapCanvas) {
      const mapPxW = this.mapCols * ts, mapPxH = this.mapRows * ts;
      scale = Math.max(w / mapPxW, h / mapPxH);
      const drawW = mapPxW * scale, drawH = mapPxH * scale;
      // 实体（角色、桥等）的偏移：基于原始地图居中
      offX = (w - drawW) / 2 + this.panX;
      offY = (h - drawH) / 2 + this.panY;
      // 地图画布的偏移：额外减去扩展 margin
      const extM = this.extMargin || 0;
      const mapCanvasOffX = offX - extM * ts * scale;
      const mapCanvasOffY = offY - extM * ts * scale;
      const mapCanvasDrawW = (this.mapCols + extM * 2) * ts * scale;
      const mapCanvasDrawH = (this.mapRows + extM * 2) * ts * scale;
      ctx.save();
      ctx.globalAlpha = this.bgOpacity;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.mapCanvas, mapCanvasOffX, mapCanvasOffY, mapCanvasDrawW, mapCanvasDrawH);
      ctx.restore();
    } else {
      ctx.fillStyle = '#2d4a2b'; ctx.fillRect(0, 0, w, h);
      scale = w / (this.mapCols * ts); offX = this.panX; offY = this.panY;
    }
    this.computeVisibleBounds(scale, offX, offY);

    // 2. 桥梁（每帧绘制，确保清晰可见）
    this.drawBridges(scale, offX, offY);

    // 3. 萤火虫
    this.particles.forEach(p => {
      const alpha = 0.3 + 0.4 * Math.sin(p.phase);
      ctx.fillStyle = `rgba(255, 230, 100, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x * ts * scale + offX, p.y * ts * scale + offY, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. 角色
    this.npcs.forEach(npc => this.drawNpc(npc, scale, offX, offY));

    // 5. 对话气泡
    this.bubbles.forEach(bubble => this.drawBubble(bubble, scale, offX, offY));

    // 6. UI
    this.drawUI();
  }

  // ===== 每帧绘制桥梁（不依赖预渲染缩放，确保清晰） =====
  drawBridges(scale, offX, offY) {
    const ctx = this.ctx, ts = this.tileDim;
    const drawBridge = (bridge) => {
      const by = bridge.y;
      const pxStart = bridge.xMin * ts * scale + offX;
      const pxEnd = (bridge.xMax + 1) * ts * scale + offX;
      const py = by * ts * scale + offY;
      const py2 = (by + 1) * ts * scale + offY;
      const bridgeW = pxEnd - pxStart;
      const bridgeH = py2 - py;

      // 桥底色（深木色）
      ctx.fillStyle = '#6B4226';
      ctx.fillRect(pxStart, py, bridgeW, bridgeH);

      // 木板面
      for (let x = bridge.xMin; x <= bridge.xMax; x++) {
        const bx = x * ts * scale + offX;
        const bw = ts * scale;
        ctx.fillStyle = '#A0826D';
        ctx.fillRect(bx + 1, py + 2, bw - 2, bridgeH - 4);
        // 木板缝隙
        ctx.fillStyle = '#6B4226';
        ctx.fillRect(bx + bw - 2, py + 2, 2, bridgeH - 4);
        // 木纹
        ctx.strokeStyle = '#8B6B4A';
        ctx.lineWidth = Math.max(1, scale * 1.5);
        ctx.beginPath();
        ctx.moveTo(bx + 3, py + bridgeH * 0.3);
        ctx.lineTo(bx + bw - 3, py + bridgeH * 0.3);
        ctx.moveTo(bx + 3, py + bridgeH * 0.65);
        ctx.lineTo(bx + bw - 3, py + bridgeH * 0.65);
        ctx.stroke();
      }

      // 桥栏杆（上下两侧）
      const railH = Math.max(3, bridgeH * 0.15);
      ctx.fillStyle = '#5C3317';
      ctx.fillRect(pxStart, py - railH, bridgeW, railH);         // 上栏杆
      ctx.fillRect(pxStart, py2, bridgeW, railH);                 // 下栏杆
      // 栏杆柱
      for (let x = bridge.xMin; x <= bridge.xMax + 1; x += 2) {
        const px = x * ts * scale + offX;
        ctx.fillRect(px - 1.5, py - railH * 1.8, 3, railH * 1.8);
        ctx.fillRect(px - 1.5, py2, 3, railH * 1.8);
      }
    };
    drawBridge(BRIDGE);
    drawBridge(BRIDGE2);
  }

  drawNpc(npc, scale, offX, offY) {
    const ctx = this.ctx, ts = this.tileDim;
    const px = npc.x * ts * scale + offX, py = npc.y * ts * scale + offY;
    const drawSize = ts * scale * this.npcScale;

    this.sketch.roughEllipse(ctx, px, py + drawSize * 0.42, drawSize * 0.28, drawSize * 0.1, { fill: 'rgba(0,0,0,0.25)', jitter: 0.5 });

    if (this.spriteImg && this.spriteImg.complete) {
      const spriteInfo = SPRITE_DATA[npc.character];
      if (spriteInfo) {
        const dirData = spriteInfo[npc.dir] || spriteInfo.down;
        const sx = dirData.x + npc.frame * 32, sy = dirData.y;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.spriteImg, sx, sy, 32, 32, px - drawSize / 2, py - drawSize / 2, drawSize, drawSize);
      }
    } else {
      ctx.fillStyle = npc.color;
      ctx.beginPath(); ctx.arc(px, py, drawSize * 0.3, 0, Math.PI * 2); ctx.fill();
    }

    // 手绘名字标签
    ctx.font = `bold 13px ${FONT_HAND}`;
    ctx.textAlign = 'center';
    const nameW = ctx.measureText(npc.name).width + 14;
    const tagX = px - nameW / 2, tagY = py - drawSize * 0.65;
    this.sketch.roughRect(ctx, tagX, tagY, nameW, 18, { fill: 'rgba(255, 250, 240, 0.88)', stroke: 'rgba(60, 50, 40, 0.5)', lineWidth: 1.2, jitter: 0.8 });
    ctx.fillStyle = '#444'; ctx.fillText(npc.name, px, tagY + 13);

    if (npc.state === 'talk') { ctx.font = `14px ${FONT_HAND}`; ctx.fillText('💬', px + drawSize * 0.35, py - drawSize * 0.2); }
  }

  drawBubble(bubble, scale, offX, offY) {
    const ctx = this.ctx, ts = this.tileDim;
    const px = bubble.npc.x * ts * scale + offX, py = bubble.npc.y * ts * scale + offY - ts * scale * 1.8;
    const alpha = Math.min(1, bubble.life);
    ctx.globalAlpha = alpha;
    ctx.font = `15px ${FONT_HAND}`;
    const text = bubble.text.length > 26 ? bubble.text.substring(0, 23) + '...' : bubble.text;
    const textWidth = ctx.measureText(text).width;
    const bubbleW = textWidth + 20, bubbleH = 28, r = 8;

    this.sketch.roughRoundRect(ctx, px - bubbleW / 2, py - bubbleH, bubbleW, bubbleH, r, { fill: 'rgba(255, 252, 245, 0.95)', stroke: 'rgba(60, 50, 40, 0.4)', lineWidth: 1.5, jitter: 1.0 });

    ctx.fillStyle = 'rgba(255, 252, 245, 0.95)'; ctx.strokeStyle = 'rgba(60, 50, 40, 0.4)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    const tailJ = this.sketch.nextJitter() * 0.8;
    ctx.moveTo(px - 5 + tailJ, py + tailJ); ctx.lineTo(px + 5 + tailJ, py + tailJ); ctx.lineTo(px + tailJ, py + 7 + tailJ); ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#333'; ctx.textAlign = 'center'; ctx.fillText(text, px, py - bubbleH / 2 + 5);
    ctx.globalAlpha = 1;
  }

  drawUI() {
    const ctx = this.ctx, w = this.canvas.width;
    ctx.font = `15px ${FONT_HAND}`; ctx.textAlign = 'left';

    const dayProgress = Math.min(1, (Date.now() - this.dayStartTime) / this.dayDuration);
    const infoLines = [`🏠 AI 小镇 — 第 ${this.dayCount} 天`, `⏱ ${Math.ceil((1 - dayProgress) * 60)}秒后新一天`];
    this.npcs.forEach(npc => {
      const stateIcon = { wander: '🚶', walk_to: '➡️', talk: '💬', idle: '😴' }[npc.state] || '❓';
      const memCount = this.memories[npc.name]?.length || 0;
      infoLines.push(`${stateIcon} ${npc.name} — ${memCount}条记忆`);
    });

    let maxW = 0;
    infoLines.forEach(line => { const tw = ctx.measureText(line).width; if (tw > maxW) maxW = tw; });
    const panelW = maxW + 24, panelH = infoLines.length * 20 + 12, panelX = 10, panelY = 10;
    this.sketch.roughRect(ctx, panelX, panelY, panelW, panelH, { fill: 'rgba(255, 250, 240, 0.82)', stroke: 'rgba(60, 50, 40, 0.35)', lineWidth: 1.3, jitter: 1.0 });
    this.sketch.roughDashedLine(ctx, panelX + 8, panelY + 42, panelX + panelW - 8, panelY + 42, { stroke: 'rgba(60, 50, 40, 0.2)', dashLen: 5, gapLen: 4, jitter: 0.6 });

    ctx.font = `bold 17px ${FONT_TITLE}`; ctx.fillStyle = '#3f51b5'; ctx.fillText(infoLines[0], panelX + 12, panelY + 22);
    ctx.font = `14px ${FONT_HAND}`; ctx.fillStyle = '#888'; ctx.fillText(infoLines[1], panelX + 12, panelY + 38);
    ctx.fillStyle = '#555';
    for (let i = 2; i < infoLines.length; i++) ctx.fillText(infoLines[i], panelX + 12, panelY + 42 + (i - 1) * 20);

    if (this.storyLog.length > 0) {
      const recent = this.storyLog.slice(-3).reverse();
      ctx.textAlign = 'right'; ctx.font = `14px ${FONT_HAND}`;
      let storyMaxW = 0;
      const storyLines = recent.map(s => {
        const line = `[D${s.day}] ${s.text}`;
        const displayLine = line.length > 28 ? line.substring(0, 25) + '...' : line;
        const tw = ctx.measureText(displayLine).width; if (tw > storyMaxW) storyMaxW = tw;
        return displayLine;
      });
      const sPanelW = storyMaxW + 24, sPanelH = storyLines.length * 20 + 12, sPanelX = w - sPanelW - 10, sPanelY = 10;
      this.sketch.roughRect(ctx, sPanelX, sPanelY, sPanelW, sPanelH, { fill: 'rgba(255, 250, 240, 0.82)', stroke: 'rgba(60, 50, 40, 0.35)', lineWidth: 1.3, jitter: 1.0 });
      ctx.fillStyle = '#8d6e63';
      storyLines.forEach((line, i) => ctx.fillText(line, w - 22, sPanelY + 22 + i * 20));
    }
  }

  getStatus() {
    return {
      day: this.dayCount,
      npcs: this.npcs.map(n => ({ name: n.name, state: n.state, position: { x: n.x, y: n.y } })),
      memories: Object.entries(this.memories).map(([name, mems]) => ({ character: name, count: mems.length, recent: mems.slice(-3) })),
      storyLog: this.storyLog.slice(-5),
    };
  }
}

export { AITown };
