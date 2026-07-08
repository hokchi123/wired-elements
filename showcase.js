// ============================================================
// Wired Elements 草稿风组件展示页 — 交互逻辑
// 导入四类核心组件：按钮、输入框、卡片、开关
// ============================================================

import './lib/wired-button.js';
import './lib/wired-input.js';
import './lib/wired-card.js';
import './lib/wired-toggle.js';

// --------------------------------------------------
// 工具函数：强制重新手绘所有 wired 组件
// 通过移除并重新添加元素来触发重新渲染（新的随机 seed）
// --------------------------------------------------
function redrawAll() {
  const wiredElements = document.querySelectorAll(
    'wired-button, wired-input, wired-card, wired-toggle'
  );
  wiredElements.forEach((el) => {
    // 重新设置 seed 属性触发重绘
    if (el.seed !== undefined) {
      el.seed = Math.floor(Math.random() * 2 ** 31);
    }
    // 强制重新渲染
    if (el.wiredRender) {
      el.wiredRender(true);
    }
    // 对于 input 需要额外触发 updated
    if (el.requestUpdate) {
      el.requestUpdate();
    }
  });
}

// --------------------------------------------------
// 工具函数：重置所有交互状态
// --------------------------------------------------
function resetAll() {
  // 重置计数器
  clickCount = 0;
  counterBtn.textContent = '点了 0 下';
  counterResult.textContent = '试试点击按钮 →';

  // 重置输入框
  nameInput.value = '';
  nameResult.textContent = '等待输入...';
  pwdInput.value = '';
  pwdResult.textContent = '密码长度：0';
  numInput.value = '';
  numResult.textContent = '数值：—';

  // 重置开关
  toggle1.checked = false;
  updateToggleStatus(toggle1Status, false);
  toggle2.checked = true;
  updateToggleStatus(toggle2Status, true);
  toggle3.checked = false;
  updateToggleStatus(toggle3Status, false);
  masterToggle.checked = false;
  slaveToggle.checked = false;
  slaveToggle.disabled = true;
  updateToggleStatus(slaveStatus, false);

  // 重置卡片内组件
  cardResult.textContent = '等待操作...';

  // 触发所有组件重绘
  setTimeout(redrawAll, 50);
}

// --------------------------------------------------
// 按钮交互
// --------------------------------------------------
const counterBtn = document.getElementById('counterBtn');
const counterResult = document.getElementById('counterResult');
let clickCount = 0;

counterBtn.addEventListener('click', () => {
  clickCount++;
  counterBtn.textContent = `点了 ${clickCount} 下`;
  counterResult.textContent = `✅ 已点击 ${clickCount} 次！`;
  if (clickCount >= 10) {
    counterResult.textContent = `🔥 太厉害了，已点击 ${clickCount} 次！`;
  }
});

// 卡片内按钮
const cardBtn = document.getElementById('cardBtn');
const cardResult = document.getElementById('cardResult');
cardBtn.addEventListener('click', () => {
  cardResult.textContent = `✅ 确认操作 @ ${new Date().toLocaleTimeString()}`;
});

// --------------------------------------------------
// 输入框交互
// --------------------------------------------------
const nameInput = document.getElementById('nameInput');
const nameResult = document.getElementById('nameResult');
nameInput.addEventListener('input', (e) => {
  const val = e.detail ? e.detail.sourceEvent.target.value : nameInput.value;
  nameResult.textContent = val ? `你好，${val}！` : '等待输入...';
});

const pwdInput = document.getElementById('pwdInput');
const pwdResult = document.getElementById('pwdResult');
pwdInput.addEventListener('input', () => {
  pwdResult.textContent = `密码长度：${pwdInput.value.length}`;
});

const numInput = document.getElementById('numInput');
const numResult = document.getElementById('numResult');
numInput.addEventListener('input', () => {
  const val = numInput.value;
  numResult.textContent = val ? `数值：${val}` : '数值：—';
});

// --------------------------------------------------
// 开关交互
// --------------------------------------------------
function updateToggleStatus(statusEl, checked) {
  if (checked) {
    statusEl.textContent = '开启';
    statusEl.classList.add('on');
    statusEl.classList.remove('off');
  } else {
    statusEl.textContent = '关闭';
    statusEl.classList.add('off');
    statusEl.classList.remove('on');
  }
}

const toggle1 = document.getElementById('toggle1');
const toggle1Status = document.getElementById('toggle1Status');
toggle1.addEventListener('change', (e) => {
  const checked = e.detail ? e.detail.checked : toggle1.checked;
  updateToggleStatus(toggle1Status, checked);
});

const toggle2 = document.getElementById('toggle2');
const toggle2Status = document.getElementById('toggle2Status');
toggle2.addEventListener('change', (e) => {
  const checked = e.detail ? e.detail.checked : toggle2.checked;
  updateToggleStatus(toggle2Status, checked);
});

const toggle3 = document.getElementById('toggle3');
const toggle3Status = document.getElementById('toggle3Status');
toggle3.addEventListener('change', (e) => {
  const checked = e.detail ? e.detail.checked : toggle3.checked;
  updateToggleStatus(toggle3Status, checked);
  // 深色模式切换效果
  if (checked) {
    document.body.style.background = '#2c2c2c';
    document.body.style.color = '#f0f0f0';
  } else {
    document.body.style.background = '';
    document.body.style.color = '';
  }
});

// 卡片内开关
const cardToggle = document.getElementById('cardToggle');
cardToggle.addEventListener('change', (e) => {
  const checked = e.detail ? e.detail.checked : cardToggle.checked;
  cardResult.textContent = checked
    ? '✅ 卡片内开关已开启'
    : '⚪ 卡片内开关已关闭';
});

// 联动开关：总开关控制子开关
const masterToggle = document.getElementById('masterToggle');
const slaveToggle = document.getElementById('slaveToggle');
const slaveStatus = document.getElementById('slaveStatus');
masterToggle.addEventListener('change', (e) => {
  const checked = e.detail ? e.detail.checked : masterToggle.checked;
  slaveToggle.disabled = !checked;
  if (!checked) {
    slaveToggle.checked = false;
    updateToggleStatus(slaveStatus, false);
  }
  // 重新渲染 disabled 状态
  if (slaveToggle.requestUpdate) {
    slaveToggle.requestUpdate();
  }
});

slaveToggle.addEventListener('change', (e) => {
  const checked = e.detail ? e.detail.checked : slaveToggle.checked;
  updateToggleStatus(slaveStatus, checked);
});

// --------------------------------------------------
// 工具栏按钮
// --------------------------------------------------
document.getElementById('redrawBtn').addEventListener('click', () => {
  redrawAll();
});

document.getElementById('resetBtn').addEventListener('click', () => {
  resetAll();
});

// --------------------------------------------------
// 页面加载完成后初始绘制
// --------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  // 确保 DOM 完全加载后再渲染
  setTimeout(redrawAll, 100);
});

console.log('🎨 Wired Elements 草稿风组件页已加载');
console.log('组件来源：wired-elements v3.0.0-rc.7 (本地源码编译)');
console.log('技术栈：RoughJS + Lit Web Components');
