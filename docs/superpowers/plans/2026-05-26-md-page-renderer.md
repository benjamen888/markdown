# Markdown 页面渲染器 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 当浏览器打开 .md 文件时，自动将原始文本替换为格式化的 markdown 预览，提供预览/源码/编辑/原始四种模式。

**Architecture:** 将 markdown-it 渲染引擎提取为共享模块，Content Script 注入浮动工具栏和渲染容器到页面，管理模式切换。esbuild 多入口构建 + code splitting 共享依赖。

**Tech Stack:** markdown-it, KaTeX, Mermaid, highlight.js, esbuild (code splitting)

---

## 文件结构

```
mdpluginchrome/
├── shared/
│   └── md-engine.js              — 提取的共享渲染引擎
├── content/
│   ├── content-script.js         — 重写：入口 + 检测逻辑
│   └── renderer/
│       ├── PageRenderer.js       — 主控制器
│       ├── Toolbar.js            — 浮动工具栏
│       ├── PreviewMode.js        — 预览模式
│       ├── SourceMode.js         — 源码模式
│       ├── EditMode.js           — 编辑模式
│       └── styles.js             — 注入的 CSS
├── sidepanel/
│   └── preview/
│       └── plugins.js            — 改为引用 shared/md-engine.js
├── build.mjs                     — 更新：多入口 + code splitting
└── manifest.json                 — 更新：content_scripts 指向 bundle
```

---

## Task 1: 提取共享渲染引擎

**Files:**
- Create: `shared/md-engine.js`
- Modify: `sidepanel/preview/plugins.js`
- Modify: `sidepanel/preview/Preview.js`

- [ ] **Step 1: 创建 shared/md-engine.js**

将 `sidepanel/preview/plugins.js` 的全部内容复制到 `shared/md-engine.js`，保持完全一致。

```javascript
// shared/md-engine.js — 内容与原 plugins.js 完全相同
// 包含: createMarkdownIt(), renderMermaidDiagrams()
```

- [ ] **Step 2: 修改 sidepanel/preview/plugins.js**

将其改为重新导出共享模块：

```javascript
export { createMarkdownIt, renderMermaidDiagrams } from '../../shared/md-engine.js';
```

- [ ] **Step 3: 验证 sidepanel 构建**

```bash
npm run build
```
预期：无错误。Side Panel 的 Preview.js 通过 plugins.js 间接引用 shared/md-engine.js。

- [ ] **Step 4: 提交**

```bash
git add shared/md-engine.js sidepanel/preview/plugins.js
git commit -m "refactor: extract markdown rendering engine to shared module"
```

---

## Task 2: 更新构建配置

**Files:**
- Modify: `build.mjs`
- Modify: `manifest.json`

- [ ] **Step 1: 更新 build.mjs — 多入口 + code splitting**

```javascript
import { build } from 'esbuild';

await build({
  entryPoints: ['sidepanel/app.js', 'content/content-script.js'],
  bundle: true,
  format: 'esm',
  outdir: 'lib',
  splitting: true,
  sourcemap: true,
});
console.log('Build complete');
```

- [ ] **Step 2: 更新 manifest.json — content_scripts 指向 bundle**

将 `content_scripts` 中的 `js` 改为使用构建后的 bundle：

```json
"content_scripts": [
  {
    "matches": ["<all_urls>"],
    "js": ["lib/content/content-script.js"],
    "run_at": "document_start"
  }
]
```

- [ ] **Step 3: 更新 sidepanel/index.html — script 路径**

将 `<script type="module" src="../lib/sidepanel-bundle.js">` 改为 `<script type="module" src="../lib/sidepanel/app.js">`。

- [ ] **Step 4: 验证构建**

```bash
npm run build
```
预期：`lib/sidepanel/app.js` 和 `lib/content/content-script.js` 生成。

- [ ] **Step 5: 提交**

```bash
git add build.mjs manifest.json sidepanel/index.html
git commit -m "feat: multi-entry build with code splitting for content script"
```

---

## Task 3: 注入样式

**Files:**
- Create: `content/renderer/styles.js`

- [ ] **Step 1: 创建 styles.js**

```javascript
export function injectStyles() {
  if (document.getElementById('md-ext-styles')) return;
  const style = document.createElement('style');
  style.id = 'md-ext-styles';
  style.textContent = `
    .md-ext-toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 2147483647;
      background: #2d2d2d;
      color: #e0e0e0;
      display: flex;
      align-items: center;
      padding: 6px 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      gap: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .md-ext-toolbar button {
      background: transparent;
      color: #ccc;
      border: 1px solid #555;
      padding: 4px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-family: inherit;
    }
    .md-ext-toolbar button:hover {
      background: #444;
      color: white;
    }
    .md-ext-toolbar button.active {
      background: #4a9eff;
      color: white;
      border-color: #4a9eff;
    }
    .md-ext-toolbar .md-ext-spacer {
      flex: 1;
    }
    .md-ext-toolbar .md-ext-title {
      color: #999;
      margin-right: 8px;
    }
    .md-ext-container {
      margin-top: 40px;
      padding: 20px 40px;
      max-width: 900px;
      margin-left: auto;
      margin-right: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
    }
    .md-ext-container h1 { font-size: 1.8em; margin: 0.8em 0 0.4em; border-bottom: 1px solid #e0e0e0; padding-bottom: 0.3em; }
    .md-ext-container h2 { font-size: 1.5em; margin: 0.8em 0 0.4em; border-bottom: 1px solid #e0e0e0; padding-bottom: 0.2em; }
    .md-ext-container h3 { font-size: 1.25em; margin: 0.6em 0 0.3em; }
    .md-ext-container p { margin: 0.5em 0; }
    .md-ext-container a { color: #4a9eff; text-decoration: none; }
    .md-ext-container a:hover { text-decoration: underline; }
    .md-ext-container code { background: #f5f5f5; padding: 2px 5px; border-radius: 3px; font-size: 0.9em; }
    .md-ext-container pre { background: #f5f5f5; padding: 12px; border-radius: 6px; overflow-x: auto; margin: 0.8em 0; }
    .md-ext-container pre code { background: none; padding: 0; }
    .md-ext-container blockquote { border-left: 3px solid #4a9eff; padding-left: 12px; color: #666; margin: 0.8em 0; }
    .md-ext-container ul, .md-ext-container ol { padding-left: 1.5em; margin: 0.5em 0; }
    .md-ext-container table { border-collapse: collapse; width: 100%; margin: 0.8em 0; }
    .md-ext-container th, .md-ext-container td { border: 1px solid #e0e0e0; padding: 6px 10px; text-align: left; }
    .md-ext-container th { background: #f5f5f5; }
    .md-ext-container img { max-width: 100%; }
    .md-ext-container hr { border: none; border-top: 1px solid #e0e0e0; margin: 1em 0; }
    .md-ext-container .task-list-item { list-style: none; }
    .md-ext-container .task-list-item input { margin-right: 6px; }
    .md-ext-container .copy-btn { float: right; background: #eee; border: 1px solid #ddd; border-radius: 3px; padding: 2px 8px; font-size: 11px; cursor: pointer; }
    .md-ext-container .copy-btn:hover { background: #ddd; }

    .md-ext-source {
      margin-top: 40px;
      padding: 20px 40px;
      max-width: 900px;
      margin-left: auto;
      margin-right: auto;
      font-family: 'Consolas', 'Fira Code', monospace;
      font-size: 13px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
      color: #333;
      background: #fafafa;
      border-radius: 6px;
    }

    .md-ext-edit-area {
      margin-top: 40px;
      display: flex;
      gap: 0;
      height: calc(100vh - 40px);
    }
    .md-ext-edit-left {
      flex: 1;
      display: flex;
      flex-direction: column;
      border-right: 2px solid #4a9eff;
    }
    .md-ext-edit-left textarea {
      flex: 1;
      border: none;
      padding: 16px;
      font-family: 'Consolas', 'Fira Code', monospace;
      font-size: 13px;
      line-height: 1.6;
      resize: none;
      outline: none;
      background: #fafafa;
    }
    .md-ext-edit-right {
      flex: 1;
      overflow: auto;
      padding: 16px 20px;
    }
    .md-ext-edit-toolbar {
      display: flex;
      gap: 8px;
      padding: 8px 12px;
      background: #f0f0f0;
      border-bottom: 1px solid #e0e0e0;
    }
    .md-ext-edit-toolbar button {
      background: #4a9eff;
      color: white;
      border: none;
      padding: 4px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .md-ext-edit-toolbar button:hover {
      background: #3a8eef;
    }
  `;
  document.head.appendChild(style);
}
```

- [ ] **Step 2: 提交**

```bash
git add content/renderer/styles.js
git commit -m "feat: injected CSS styles for page markdown renderer"
```

---

## Task 4: 浮动工具栏

**Files:**
- Create: `content/renderer/Toolbar.js`

- [ ] **Step 1: 创建 Toolbar.js**

```javascript
export class Toolbar {
  constructor(onModeChange, onOpenSidePanel) {
    this.onModeChange = onModeChange;
    this.onOpenSidePanel = onOpenSidePanel;
    this.currentMode = 'preview';
    this.element = this.create();
  }

  create() {
    const bar = document.createElement('div');
    bar.className = 'md-ext-toolbar';

    const title = document.createElement('span');
    title.className = 'md-ext-title';
    title.textContent = 'Markdown';

    const modes = ['preview', 'source', 'edit', 'raw'];
    const labels = { preview: '预览', source: '源码', edit: '编辑', raw: '原始' };

    this.buttons = {};
    for (const mode of modes) {
      const btn = document.createElement('button');
      btn.textContent = labels[mode];
      btn.dataset.mode = mode;
      if (mode === 'preview') btn.classList.add('active');
      btn.addEventListener('click', () => this.setMode(mode));
      this.buttons[mode] = btn;
    }

    const spacer = document.createElement('div');
    spacer.className = 'md-ext-spacer';

    const openBtn = document.createElement('button');
    openBtn.textContent = '在 Side Panel 打开';
    openBtn.addEventListener('click', () => this.onOpenSidePanel());

    bar.appendChild(title);
    for (const mode of modes) {
      bar.appendChild(this.buttons[mode]);
    }
    bar.appendChild(spacer);
    bar.appendChild(openBtn);

    return bar;
  }

  setMode(mode) {
    this.currentMode = mode;
    for (const [key, btn] of Object.entries(this.buttons)) {
      btn.classList.toggle('active', key === mode);
    }
    this.onModeChange(mode);
  }

  mount(parent) {
    parent.appendChild(this.element);
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add content/renderer/Toolbar.js
git commit -m "feat: floating toolbar for page markdown renderer"
```

---

## Task 5: 预览和源码模式

**Files:**
- Create: `content/renderer/PreviewMode.js`
- Create: `content/renderer/SourceMode.js`

- [ ] **Step 1: 创建 PreviewMode.js**

```javascript
import { createMarkdownIt, renderMermaidDiagrams } from '../../shared/md-engine.js';

export class PreviewMode {
  constructor() {
    this.md = createMarkdownIt();
    this.element = document.createElement('div');
    this.element.className = 'md-ext-container';
  }

  render(markdown) {
    this.element.innerHTML = this.md.render(markdown || '');
    renderMermaidDiagrams(this.element);
  }

  show() {
    this.element.style.display = '';
  }

  hide() {
    this.element.style.display = 'none';
  }

  mount(parent) {
    parent.appendChild(this.element);
  }
}
```

- [ ] **Step 2: 创建 SourceMode.js**

```javascript
export class SourceMode {
  constructor() {
    this.element = document.createElement('pre');
    this.element.className = 'md-ext-source';
  }

  render(markdown) {
    this.element.textContent = markdown || '';
  }

  show() {
    this.element.style.display = '';
  }

  hide() {
    this.element.style.display = 'none';
  }

  mount(parent) {
    parent.appendChild(this.element);
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add content/renderer/PreviewMode.js content/renderer/SourceMode.js
git commit -m "feat: preview and source display modes"
```

---

## Task 6: 编辑模式

**Files:**
- Create: `content/renderer/EditMode.js`

- [ ] **Step 1: 创建 EditMode.js**

```javascript
import { createMarkdownIt, renderMermaidDiagrams } from '../../shared/md-engine.js';

export class EditMode {
  constructor() {
    this.md = createMarkdownIt();
    this.element = this.create();
  }

  create() {
    const container = document.createElement('div');
    container.className = 'md-ext-edit-area';

    // 左侧编辑区
    const left = document.createElement('div');
    left.className = 'md-ext-edit-left';

    const toolbar = document.createElement('div');
    toolbar.className = 'md-ext-edit-toolbar';

    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = '下载';
    downloadBtn.addEventListener('click', () => this.download());

    const saveBtn = document.createElement('button');
    saveBtn.textContent = '保存';
    saveBtn.addEventListener('click', () => this.save());

    toolbar.appendChild(saveBtn);
    toolbar.appendChild(downloadBtn);

    this.textarea = document.createElement('textarea');
    this.textarea.placeholder = '输入 Markdown 内容...';
    this.textarea.addEventListener('input', () => this.updatePreview());

    left.appendChild(toolbar);
    left.appendChild(this.textarea);

    // 右侧预览区
    const right = document.createElement('div');
    right.className = 'md-ext-edit-right md-ext-container';
    this.previewContainer = right;

    container.appendChild(left);
    container.appendChild(right);

    return container;
  }

  render(markdown) {
    this.textarea.value = markdown || '';
    this.updatePreview();
  }

  updatePreview() {
    const text = this.textarea.value;
    this.previewContainer.innerHTML = this.md.render(text || '');
    renderMermaidDiagrams(this.previewContainer);
  }

  download() {
    const content = this.textarea.value;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = document.title.replace(/\.[^.]+$/, '') + '.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  save() {
    this.download();
  }

  show() {
    this.element.style.display = '';
  }

  hide() {
    this.element.style.display = 'none';
  }

  mount(parent) {
    parent.appendChild(this.element);
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add content/renderer/EditMode.js
git commit -m "feat: edit mode with textarea and live preview"
```

---

## Task 7: 主控制器和入口

**Files:**
- Create: `content/renderer/PageRenderer.js`
- Modify: `content/content-script.js`

- [ ] **Step 1: 创建 PageRenderer.js**

```javascript
import { injectStyles } from './styles.js';
import { Toolbar } from './Toolbar.js';
import { PreviewMode } from './PreviewMode.js';
import { SourceMode } from './SourceMode.js';
import { EditMode } from './EditMode.js';

export class PageRenderer {
  constructor(markdown, url) {
    this.markdown = markdown;
    this.url = url;
    this.originalBody = document.body.innerHTML;

    injectStyles();

    this.previewMode = new PreviewMode();
    this.sourceMode = new SourceMode();
    this.editMode = new EditMode();
    this.toolbar = new Toolbar(
      (mode) => this.switchMode(mode),
      () => this.openSidePanel()
    );

    this.modes = {
      preview: this.previewMode,
      source: this.sourceMode,
      edit: this.editMode,
    };
  }

  render() {
    // 清空页面
    document.body.innerHTML = '';

    // 注入工具栏
    this.toolbar.mount(document.body);

    // 注入各模式容器
    this.previewMode.mount(document.body);
    this.sourceMode.mount(document.body);
    this.editMode.mount(document.body);

    // 渲染内容
    this.previewMode.render(this.markdown);
    this.sourceMode.render(this.markdown);
    this.editMode.render(this.markdown);

    // 默认显示预览
    this.switchMode('preview');
  }

  switchMode(mode) {
    if (mode === 'raw') {
      this.restoreOriginal();
      return;
    }

    for (const [key, handler] of Object.entries(this.modes)) {
      if (key === mode) {
        handler.show();
      } else {
        handler.hide();
      }
    }
  }

  restoreOriginal() {
    document.body.innerHTML = this.originalBody;
    // 重新添加工具栏，但只显示一个恢复按钮
    const bar = document.createElement('div');
    bar.className = 'md-ext-toolbar';
    const btn = document.createElement('button');
    btn.textContent = '返回预览';
    btn.classList.add('active');
    btn.addEventListener('click', () => {
      this.render();
    });
    bar.appendChild(btn);
    document.body.prepend(bar);
  }

  openSidePanel() {
    chrome.runtime.sendMessage({ action: 'openInSidePanel', url: this.url });
  }
}
```

- [ ] **Step 2: 重写 content-script.js**

```javascript
(function() {
  const url = window.location.href;
  const isMarkdown = /\.(md|markdown)(\?.*)?$/i.test(url) ||
    document.contentType === 'text/markdown';

  if (!isMarkdown) return;

  // 等待 DOM 加载完成
  function init() {
    const text = document.body.innerText;
    if (!text || text.trim().length === 0) {
      // body 还没有内容，稍后重试
      setTimeout(init, 100);
      return;
    }

    // 动态导入渲染器（使用 esbuild 构建后的 bundle）
    import(chrome.runtime.getURL('lib/content/renderer/PageRenderer.js'))
      .then(({ PageRenderer }) => {
        const renderer = new PageRenderer(text, url);
        renderer.render();
      })
      .catch((err) => {
        console.error('Markdown 渲染器加载失败:', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

- [ ] **Step 3: 验证构建**

```bash
npm run build
```
预期：`lib/content/content-script.js` 和 `lib/sidepanel/app.js` 生成。

- [ ] **Step 4: 提交**

```bash
git add content/renderer/PageRenderer.js content/content-script.js
git commit -m "feat: page renderer controller and rewritten content script"
```

---

## Task 8: 更新 manifest 并修复内容脚本加载

**Files:**
- Modify: `manifest.json`

- [ ] **Step 1: 更新 manifest.json 添加 web_accessible_resources**

Content Script 需要动态导入构建后的模块，需要声明为可访问资源：

```json
{
  "manifest_version": 3,
  "name": "Markdown 浏览器",
  "version": "1.0.0",
  "description": "浏览和编辑 Markdown 文件",
  "permissions": [
    "sidePanel",
    "storage",
    "activeTab"
  ],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "background/service-worker.js"
  },
  "side_panel": {
    "default_path": "sidepanel/index.html"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/content-script.js"],
      "run_at": "document_start"
    }
  ],
  "web_accessible_resources": [
    {
      "resources": ["lib/*", "lib/**/*"],
      "matches": ["<all_urls>"]
    }
  ],
  "icons": {}
}
```

注意：content_scripts 保持指向原始的 `content/content-script.js`（非 bundle），因为它只是入口引导脚本，动态导入 bundle。

- [ ] **Step 2: 验证构建**

```bash
npm run build
```

- [ ] **Step 3: 提交**

```bash
git add manifest.json
git commit -m "feat: add web_accessible_resources for content script modules"
```

---

## Task 9: 完整构建和测试

- [ ] **Step 1: 完整构建**

```bash
npm run build
```
预期：`lib/` 目录下生成所有 bundle 文件。

- [ ] **Step 2: 在 Chrome 中重新加载扩展**

1. 打开 `chrome://extensions`
2. 点击刷新按钮重新加载扩展

- [ ] **Step 3: 测试页面渲染**

1. 在浏览器中打开一个 .md 文件 URL（如 GitHub 上的 README.md raw 链接）
2. 页面应自动显示渲染后的 markdown 预览
3. 工具栏应显示在顶部
4. 点击「源码」按钮，显示原始 markdown 文本
5. 点击「编辑」按钮，显示左侧编辑器 + 右侧预览
6. 点击「原始」按钮，恢复浏览器默认显示
7. 点击「返回预览」按钮，回到渲染模式
8. 点击「在 Side Panel 打开」，侧边栏应打开

- [ ] **Step 4: 修复发现的问题**

根据测试结果修复。

- [ ] **Step 5: 最终提交**

```bash
git add -A
git commit -m "chore: final build and fixes after page renderer testing"
```

---

## 自审结果

1. **Spec 覆盖**: 所有规格要求有对应 Task — 自动检测(Task 7)、四种模式(Task 4-7)、工具栏(Task 4)、编辑模式(Task 6)、Side Panel 打开(Task 7)。
2. **占位符扫描**: 无 TBD/TODO。
3. **类型一致性**: 方法名 `show()`/`hide()`/`render()`/`mount()` 在各模式类中一致。
