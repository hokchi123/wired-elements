// ============================================================
// 音乐解锁 (Unlock Music) — 手绘风复刻版
// UI 组件：wired-elements (RoughJS + Lit Web Components)
// ============================================================

// ---- 导入 AI 小镇引擎 ----
import { AITown } from './ai-town.js';

// ---- wired-elements 组件（容错加载）----
// 使用动态 import 避免单个组件失败影响全局
['./lib/wired-button.js', './lib/wired-input.js', './lib/wired-card.js',
 './lib/wired-toggle.js', './lib/wired-tabs.js', './lib/wired-tab.js',
 './lib/wired-divider.js', './lib/wired-link.js'].forEach(src => {
  import(src).catch(() => {});
});

// ============================================================
// 工具函数
// ============================================================

function showToast(msg, duration = 2500) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function getFormat(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const formatMap = {
    ncm: 'NCM', qmc0: 'QMC', qmc3: 'QMC', qmcflac: 'QMC',
    qmcogg: 'QMC', mflac: 'MFLAC', mgg: 'MGG', mggl: 'MGG',
    kgm: 'KGM', kgma: 'KGM', vpr: 'VPR', kgg: 'KGG',
    kwm: 'KWM', tkm: 'TKM'
  };
  return formatMap[ext] || ext.toUpperCase();
}

// ============================================================
// SPA 路由
// ============================================================

const pages = ['app'];
let currentPage = 'app';

function navigateTo(page) {
  if (!pages.includes(page)) return;
  currentPage = page;

  // 切换页面显示
  pages.forEach((p) => {
    const el = document.getElementById('page-' + p);
    if (el) {
      el.classList.toggle('active', p === page);
    }
  });

  // 更新导航按钮高亮
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-page') === page);
  });

  // 触发 wired 组件重绘（切换页面后尺寸变化需要重绘）
  setTimeout(() => {
    const visiblePage = document.getElementById('page-' + page);
    if (visiblePage) {
      visiblePage.querySelectorAll(
        'wired-button, wired-input, wired-card, wired-toggle, wired-tab, wired-divider'
      ).forEach((el) => {
        if (el.wiredRender) el.wiredRender(true);
        if (el.requestUpdate) el.requestUpdate();
      });
    }
  }, 100);

  // 更新 URL hash
  if (location.hash !== '#' + page) {
    history.replaceState(null, '', '#' + page);
  }
}

// 绑定导航按钮
document.querySelectorAll('.nav-btn, .logo[data-page]').forEach((el) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    const page = el.getAttribute('data-page');
    if (page) navigateTo(page);
  });
});

// 根据 URL hash 初始路由
const initialHash = location.hash.replace('#', '');
if (pages.includes(initialHash)) {
  navigateTo(initialHash);
}

// ============================================================
// 文件上传 & 解密模拟
// ============================================================

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileListContainer = document.getElementById('fileListContainer');
const fileTableBody = document.getElementById('fileTableBody');
const fileCountEl = document.getElementById('fileCount');
let files = []; // {id, name, size, format, status, blobUrl}

// 点击上传区打开文件选择
dropZone.addEventListener('click', () => fileInput.click());

// 文件选择
fileInput.addEventListener('change', (e) => {
  addFiles(e.target.files);
  fileInput.value = '';
});

// 拖放
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
    addFiles(e.dataTransfer.files);
  }
});

function addFiles(fileList) {
  for (const file of fileList) {
    const id = Date.now() + Math.random();
    files.push({
      id,
      name: file.name,
      size: file.size,
      format: getFormat(file.name),
      status: 'pending',
      blobUrl: null,
      originalFile: file
    });
  }
  renderFileList();
  showToast(`已添加 ${fileList.length} 个文件`);
}

function renderFileList() {
  fileCountEl.textContent = files.length;
  fileListContainer.style.display = files.length > 0 ? 'block' : 'none';

  fileTableBody.innerHTML = files.map((f) => {
    const statusText = {
      pending: '⏳ 待解密',
      processing: '🔄 解密中',
      done: '✅ 已解密',
      error: '❌ 失败'
    }[f.status] || f.status;

    const actionHtml = f.status === 'done'
      ? `<wired-button elevation="1" data-action="download" data-id="${f.id}">⬇️ 下载</wired-button>`
      : f.status === 'pending'
        ? `<wired-button elevation="1" data-action="decrypt" data-id="${f.id}">🔓 解密</wired-button>`
        : f.status === 'error'
          ? `<wired-button elevation="1" data-action="retry" data-id="${f.id}">🔄 重试</wired-button>`
          : '<span style="color:#999;">...</span>';

    return `
      <tr class="file-row" data-id="${f.id}">
        <td>${escapeHtml(f.name)}</td>
        <td><span style="font-weight:bold; color:#555;">${f.format}</span></td>
        <td>${formatSize(f.size)}</td>
        <td><span class="file-status ${f.status}">${statusText}</span></td>
        <td>${actionHtml}</td>
      </tr>
    `;
  }).join('');

  // 绑定操作按钮
  fileTableBody.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.getAttribute('data-action');
      const id = parseFloat(btn.getAttribute('data-id'));
      if (action === 'decrypt' || action === 'retry') {
        decryptFile(id);
      } else if (action === 'download') {
        downloadFile(id);
      }
    });
  });

  // 重绘新增的 wired-button
  setTimeout(() => {
    fileTableBody.querySelectorAll('wired-button').forEach((el) => {
      if (el.wiredRender) el.wiredRender(true);
    });
  }, 50);
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// 模拟解密（原项目使用 WASM 在浏览器内解密，这里模拟流程）
function decryptFile(id) {
  const file = files.find((f) => f.id === id);
  if (!file) return;

  file.status = 'processing';
  renderFileList();

  // 模拟解密过程（原项目会调用 WASM 解密引擎）
  setTimeout(() => {
    // 模拟 90% 成功率
    if (Math.random() > 0.1) {
      file.status = 'done';
      // 创建模拟的解密后文件（原项目中是真正的解密后音频）
      const blob = new Blob([file.originalFile], { type: 'audio/mpeg' });
      file.blobUrl = URL.createObjectURL(blob);
      // 修改扩展名为 .flac 或 .mp3
      file.decryptedName = file.name.replace(/\.[^.]+$/, '.flac');
      showToast(`✅ ${file.name} 解密成功`);
    } else {
      file.status = 'error';
      showToast(`❌ ${file.name} 解密失败`);
    }
    renderFileList();
  }, 1200 + Math.random() * 800);
}

function downloadFile(id) {
  const file = files.find((f) => f.id === id);
  if (!file || !file.blobUrl) return;

  const a = document.createElement('a');
  a.href = file.blobUrl;
  a.download = file.decryptedName || file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast(`⬇️ 正在下载 ${file.decryptedName}`);
}

// 全部解密
document.getElementById('decryptAllBtn').addEventListener('click', () => {
  const pending = files.filter((f) => f.status === 'pending' || f.status === 'error');
  if (pending.length === 0) {
    showToast('没有待解密的文件');
    return;
  }
  showToast(`开始解密 ${pending.length} 个文件...`);
  pending.forEach((f, i) => {
    setTimeout(() => decryptFile(f.id), i * 300);
  });
});

// 清空列表
document.getElementById('clearAllBtn').addEventListener('click', () => {
  files.forEach((f) => {
    if (f.blobUrl) URL.revokeObjectURL(f.blobUrl);
  });
  files = [];
  renderFileList();
  showToast('已清空文件列表');
});

// ============================================================
// 页面加载完成
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
  // 确保 wired 组件渲染
  setTimeout(() => {
    document.querySelectorAll(
      'wired-button, wired-input, wired-card, wired-toggle, wired-tabs'
    ).forEach((el) => {
      if (el.wiredRender) el.wiredRender(true);
      if (el.requestUpdate) el.requestUpdate();
    });
  }, 200);

  console.log('🎵 音乐解锁 (Unlock Music) — 手绘风复刻版');
  console.log('UI 组件：wired-elements (RoughJS + Lit)');
  console.log('原项目：https://um-react.netlify.app/');

  // ===== 启动 AI 小镇背景 =====
  const canvas = document.getElementById('aiTownCanvas');
  if (canvas) {
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 加载精灵图
    const spriteImg = new Image();
    spriteImg.src = './assets/32x32folk.png';
    spriteImg.onload = () => {
      console.log('[AI 小镇] 精灵图加载完成');
    };

    // 加载原版贴图
    const tilesetImg = new Image();
    tilesetImg.src = './assets/gentle-obj.png';
    tilesetImg.onload = () => {
      console.log('[AI 小镇] 原版贴图加载完成');
      aiTown.loadTileset(tilesetImg);
    };

    // 创建 AI 小镇实例
    const aiTown = new AITown(canvas, { seed: 42, opacity: 0.95, npcScale: 1.5 });
    aiTown.loadSprite(spriteImg);
    window.aiTown = aiTown; // 暴露到 window 便于调试

    // ===== 左键拖动平移视角 =====
    let isDragging = false;
    let dragStartX = 0, dragStartY = 0;
    let dragStartPanX = 0, dragStartPanY = 0;
    const interactiveTags = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A', 'WIRED-BUTTON', 'WIRED-INPUT', 'WIRED-CHECKBOX', 'WIRED-TOGGLE', 'WIRED-COMBO', 'WIRED-SLIDER', 'WIRED-TAB', 'WIRED-TABS', 'WIRED-LISTBOX', 'WIRED-DIALOG', 'WIRED-TEXTAREA', 'WIRED-SEARCH-INPUT', 'WIRED-RADIO', 'WIRED-RADIO-GROUP', 'WIRED-ICON-BUTTON', 'WIRED-FAB']);

    const isInteractive = (el) => {
      if (!el) return false;
      if (interactiveTags.has(el.tagName)) return true;
      if (el.closest && el.closest('[role="button"], button, input, select, textarea, a[href]')) return true;
      return false;
    };

    document.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // 只响应左键
      if (isInteractive(e.target)) return;
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragStartPanX = aiTown.panX;
      dragStartPanY = aiTown.panY;
      document.body.style.cursor = 'grabbing';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      aiTown.panX = dragStartPanX + (e.clientX - dragStartX);
      aiTown.panY = dragStartPanY + (e.clientY - dragStartY);
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
      }
    });

    // 阻止拖动时选中文本
    document.addEventListener('dragstart', (e) => { if (isDragging) e.preventDefault(); });

    // 等待手绘字体加载完成后启动，确保 Canvas 文字正确渲染
    const startTown = () => aiTown.start();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        console.log('[AI 小镇] 手绘字体已就绪');
        startTown();
      });
    } else {
      startTown();
    }

    console.log('[AI 小镇] 6 个角色已启动，正在自由走动...');
    console.log('[AI 小镇] 角色：Lucky（乐天派）、Bob（暴躁老哥）、Alice（科学家）、Kurt（百科全书）、Stella（精明骗子）、Pete（虔诚信徒）');
    console.log('[AI 小镇] 含碰撞检测、桥梁、每个角色预置 10 条记忆，自动生成剧情');

    // 每 30 秒在控制台打印一次状态摘要
    setInterval(() => {
      const status = aiTown.getStatus();
      console.log(`[AI 小镇] 第 ${status.day} 天 | ${status.npcs.map(n => `${n.name}(${n.state})`).join(', ')}`);
      console.log(`[AI 小镇] 记忆：${status.memories.map(m => `${m.character}=${m.count}条`).join(', ')}`);
    }, 30000);
  }
});

// 监听窗口大小变化，重绘所有 wired 组件
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    document.querySelectorAll(
      'wired-button, wired-input, wired-card, wired-toggle, wired-tab, wired-divider'
    ).forEach((el) => {
      if (el.wiredRender) el.wiredRender(true);
    });
  }, 200);
});
