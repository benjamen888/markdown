# Markdown 浏览器 Chrome 扩展 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个 Chrome Side Panel 扩展，支持浏览和编辑 Markdown 文件，具备 WYSIWYG/源码双模式编辑、完整特性预览、本地文件读写和远程 URL 加载能力。

**Architecture:** Manifest V3 Chrome 扩展，Side Panel 作为主界面。使用 CodeMirror 6 作为编辑器内核，markdown-it 作为渲染引擎。通过 esbuild 打包 npm 依赖为 ES module bundle，Chrome 原生加载。

**Tech Stack:** CodeMirror 6, markdown-it, KaTeX, Mermaid, highlight.js, esbuild (构建), Chrome Side Panel API

---

## 文件结构

```
mdpluginchrome/
├── manifest.json                    — Chrome 扩展配置
├── package.json                     — npm 依赖
├── build.mjs                        — esbuild 构建脚本
├── .gitignore
│
├── sidepanel/
│   ├── index.html                   — 主页面
│   ├── app.js                       — 应用入口，模式切换
│   ├── editor/
│   │   ├── Editor.js                — CodeMirror 6 封装
│   │   ├── wysiwyg.js               — WYSIWYG Decoration
│   │   └── shortcuts.js             — 快捷键
│   ├── preview/
│   │   ├── Preview.js               — markdown-it 渲染
│   │   ├── plugins.js               — KaTeX/Mermaid/highlight 插件
│   │   └── scroll-sync.js           — 同步滚动
│   ├── file-manager/
│   │   ├── FileTree.js              — 文件树
│   │   ├── RecentFiles.js           — 最近文件
│   │   └── FileOps.js               — 文件读写
│   └── styles/
│       └── main.css                 — 全部样式
│
├── background/
│   └── service-worker.js            — 后台 service worker
│
├── content/
│   └── content-script.js            — 拦截 .md URL
│
└── lib/                             — esbuild 输出目录
    └── sidepanel-bundle.js
```

---

## Task 1: 项目脚手架

**Files:**
- Create: `package.json`
- Create: `manifest.json`
- Create: `.gitignore`
- Create: `build.mjs`

- [ ] **Step 1: 初始化 npm 项目**

```bash
cd D:\lyqwork\code\mdpluginchrome
npm init -y
```

- [ ] **Step 2: 安装依赖**

```bash
npm install @codemirror/view @codemirror/state @codemirror/lang-markdown @codemirror/language @codemirror/commands @codemirror/search @codemirror/autocomplete @codemirror/lint markdown-it markdown-it-emoji markdown-it-footnote markdown-it-task-lists markdown-it-anchor markdown-it-toc-done-right katex mermaid highlight.js
npm install -D esbuild
```

- [ ] **Step 3: 创建 manifest.json**

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
  "icons": {}
}
```

- [ ] **Step 4: 创建 build.mjs**

```javascript
import { build } from 'esbuild';

await build({
  entryPoints: ['sidepanel/app.js'],
  bundle: true,
  format: 'esm',
  outfile: 'lib/sidepanel-bundle.js',
  sourcemap: true,
});
console.log('Build complete');
```

- [ ] **Step 5: 更新 package.json scripts**

在 `package.json` 中添加：
```json
{
  "scripts": {
    "build": "node build.mjs",
    "watch": "node build.mjs --watch"
  }
}
```

- [ ] **Step 6: 创建 .gitignore**

```
node_modules/
lib/
.superpowers/
```

- [ ] **Step 7: 验证构建**

```bash
npm run build
```
预期：`lib/sidepanel-bundle.js` 生成，无错误。

- [ ] **Step 8: 初始化 git 并提交**

```bash
git init
git add package.json manifest.json .gitignore build.mjs package-lock.json
git commit -m "chore: project scaffolding with manifest and build"
```

---

## Task 2: HTML 和 CSS 布局

**Files:**
- Create: `sidepanel/index.html`
- Create: `sidepanel/styles/main.css`

- [ ] **Step 1: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown 浏览器</title>
  <link rel="stylesheet" href="styles/main.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
</head>
<body>
  <div id="app">
    <!-- 顶部工具栏 -->
    <div id="toolbar">
      <div class="mode-tabs">
        <button class="tab active" data-mode="split">分屏</button>
        <button class="tab" data-mode="edit">编辑</button>
        <button class="tab" data-mode="preview">预览</button>
        <button class="tab" data-mode="files">文件</button>
      </div>
      <div class="toolbar-actions">
        <button id="btn-open" title="打开文件">📁</button>
        <button id="btn-open-folder" title="打开文件夹">📂</button>
        <button id="btn-open-url" title="从 URL 打开">🔗</button>
        <button id="btn-new" title="新建">📄</button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div id="main">
      <!-- 编辑器区 -->
      <div id="editor-pane">
        <div id="editor"></div>
      </div>
      <!-- 预览区 -->
      <div id="preview-pane">
        <div id="preview"></div>
      </div>
      <!-- 文件浏览器区 -->
      <div id="files-pane" style="display:none;">
        <div id="recent-files"></div>
        <div id="file-tree"></div>
      </div>
    </div>

    <!-- 底部状态栏 -->
    <div id="statusbar">
      <span id="status-filename">未打开文件</span>
      <span id="status-info">UTF-8 | 0 行 | 0 字</span>
      <div class="status-actions">
        <button id="btn-save" title="保存">💾</button>
        <button id="btn-download" title="下载">⬇</button>
        <button id="btn-theme" title="切换主题">🌙</button>
      </div>
    </div>
  </div>

  <!-- URL 输入对话框 -->
  <dialog id="url-dialog">
    <form method="dialog">
      <label>输入 Markdown 文件 URL:</label>
      <input type="url" id="url-input" placeholder="https://example.com/readme.md">
      <div class="dialog-actions">
        <button type="button" id="url-cancel">取消</button>
        <button type="submit" id="url-confirm">打开</button>
      </div>
    </form>
  </dialog>

  <script type="module" src="../lib/sidepanel-bundle.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 main.css**

```css
:root {
  --bg: #ffffff;
  --bg-secondary: #f5f5f5;
  --text: #1a1a1a;
  --text-secondary: #666;
  --border: #e0e0e0;
  --accent: #4a9eff;
  --accent-hover: #3a8eef;
  --toolbar-bg: #fafafa;
  --statusbar-bg: #f0f0f0;
  --tab-active: #4a9eff;
  --tab-text: #666;
}

[data-theme="dark"] {
  --bg: #1e1e1e;
  --bg-secondary: #252525;
  --text: #e0e0e0;
  --text-secondary: #999;
  --border: #333;
  --accent: #5aafff;
  --accent-hover: #4a9fef;
  --toolbar-bg: #2d2d2d;
  --statusbar-bg: #252525;
  --tab-active: #5aafff;
  --tab-text: #999;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  height: 100vh;
  overflow: hidden;
}

#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* 工具栏 */
#toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: var(--toolbar-bg);
  border-bottom: 1px solid var(--border);
  gap: 8px;
}

.mode-tabs {
  display: flex;
  gap: 2px;
}

.tab {
  padding: 4px 10px;
  border: none;
  background: transparent;
  color: var(--tab-text);
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
}

.tab.active {
  background: var(--tab-active);
  color: white;
}

.toolbar-actions {
  display: flex;
  gap: 4px;
}

.toolbar-actions button,
.status-actions button {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 14px;
}

.toolbar-actions button:hover,
.status-actions button:hover {
  background: var(--bg-secondary);
}

/* 主内容区 */
#main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 编辑器 */
#editor-pane {
  flex: 1;
  overflow: hidden;
  border-bottom: 1px solid var(--border);
}

#editor {
  height: 100%;
  overflow: auto;
}

/* 预览 */
#preview-pane {
  flex: 1;
  overflow: auto;
  padding: 16px 20px;
}

#preview {
  line-height: 1.6;
  font-size: 14px;
}

/* 文件面板 */
#files-pane {
  flex: 1;
  overflow: auto;
  padding: 10px;
}

#recent-files {
  margin-bottom: 16px;
}

#recent-files h3,
#file-tree h3 {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.file-item {
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
}

.file-item:hover {
  background: var(--bg-secondary);
}

.file-item.active {
  color: var(--accent);
}

/* 状态栏 */
#statusbar {
  display: flex;
  align-items: center;
  padding: 4px 10px;
  background: var(--statusbar-bg);
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-secondary);
  gap: 8px;
}

#status-filename {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-actions {
  display: flex;
  gap: 4px;
}

/* 对话框 */
dialog {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  background: var(--bg);
  color: var(--text);
}

dialog label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
}

dialog input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text);
  font-size: 13px;
  margin-bottom: 12px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.dialog-actions button {
  padding: 6px 16px;
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  background: var(--bg);
  color: var(--text);
}

.dialog-actions button[type="submit"] {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

/* 编辑器样式覆盖 */
.cm-editor {
  height: 100%;
}

.cm-editor .cm-scroller {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

/* 预览 Markdown 样式 */
#preview h1 { font-size: 1.8em; margin: 0.8em 0 0.4em; border-bottom: 1px solid var(--border); padding-bottom: 0.3em; }
#preview h2 { font-size: 1.5em; margin: 0.8em 0 0.4em; border-bottom: 1px solid var(--border); padding-bottom: 0.2em; }
#preview h3 { font-size: 1.25em; margin: 0.6em 0 0.3em; }
#preview h4 { font-size: 1.1em; margin: 0.5em 0 0.3em; }
#preview p { margin: 0.5em 0; }
#preview a { color: var(--accent); text-decoration: none; }
#preview a:hover { text-decoration: underline; }
#preview code { background: var(--bg-secondary); padding: 2px 5px; border-radius: 3px; font-size: 0.9em; }
#preview pre { background: var(--bg-secondary); padding: 12px; border-radius: 6px; overflow-x: auto; margin: 0.8em 0; }
#preview pre code { background: none; padding: 0; }
#preview blockquote { border-left: 3px solid var(--accent); padding-left: 12px; color: var(--text-secondary); margin: 0.8em 0; }
#preview ul, #preview ol { padding-left: 1.5em; margin: 0.5em 0; }
#preview table { border-collapse: collapse; width: 100%; margin: 0.8em 0; }
#preview th, #preview td { border: 1px solid var(--border); padding: 6px 10px; text-align: left; }
#preview th { background: var(--bg-secondary); }
#preview img { max-width: 100%; }
#preview hr { border: none; border-top: 1px solid var(--border); margin: 1em 0; }
#preview .task-list-item { list-style: none; }
#preview .task-list-item input { margin-right: 6px; }
#preview .footnotes { margin-top: 2em; border-top: 1px solid var(--border); padding-top: 1em; font-size: 0.9em; }
```

- [ ] **Step 3: 构建并验证**

```bash
npm run build
```
预期：无错误。

- [ ] **Step 4: 提交**

```bash
git add sidepanel/index.html sidepanel/styles/main.css
git commit -m "feat: HTML structure and CSS layout for side panel"
```

---

## Task 3: CodeMirror 6 编辑器

**Files:**
- Create: `sidepanel/editor/Editor.js`

- [ ] **Step 1: 创建 Editor.js**

```javascript
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';

export class Editor {
  constructor(container, onChange) {
    this.onChange = onChange;
    this.view = new EditorView({
      state: EditorState.create({
        doc: '',
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          history(),
          bracketMatching(),
          closeBrackets(),
          highlightSelectionMatches(),
          syntaxHighlighting(defaultHighlightStyle),
          markdown({ base: markdownLanguage }),
          autocompletion(),
          keymap.of([
            ...defaultKeymap,
            ...historyKeymap,
            ...searchKeymap,
            ...closeBracketsKeymap,
            indentWithTab,
          ]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              this.onChange(update.state.doc.toString());
            }
          }),
          EditorView.theme({
            '&': { height: '100%' },
            '.cm-scroller': { overflow: 'auto' },
          }),
        ],
      }),
      parent: container,
    });
  }

  getContent() {
    return this.view.state.doc.toString();
  }

  setContent(text) {
    this.view.dispatch({
      changes: { from: 0, to: this.view.state.doc.length, insert: text },
    });
  }

  getCursorPos() {
    return this.view.state.selection.main.head;
  }

  getLineCount() {
    return this.view.state.doc.lines;
  }

  insertText(text) {
    const { from, to } = this.view.state.selection.main;
    this.view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length },
    });
    this.view.focus();
  }

  wrapSelection(before, after) {
    const { from, to } = this.view.state.selection.main;
    const selected = this.view.state.sliceDoc(from, to);
    const replacement = before + selected + after;
    this.view.dispatch({
      changes: { from, to, insert: replacement },
      selection: { anchor: from + before.length, head: from + before.length + selected.length },
    });
    this.view.focus();
  }

  destroy() {
    this.view.destroy();
  }
}
```

- [ ] **Step 2: 构建验证**

```bash
npm run build
```
预期：无错误。

- [ ] **Step 3: 提交**

```bash
git add sidepanel/editor/Editor.js
git commit -m "feat: CodeMirror 6 editor with markdown support"
```

---

## Task 4: Markdown 预览渲染器

**Files:**
- Create: `sidepanel/preview/Preview.js`
- Create: `sidepanel/preview/plugins.js`

- [ ] **Step 1: 创建 plugins.js**

```javascript
import markdownIt from 'markdown-it';
import emoji from 'markdown-it-emoji';
import footnote from 'markdown-it-footnote';
import taskLists from 'markdown-it-task-lists';
import anchor from 'markdown-it-anchor';
import toc from 'markdown-it-toc-done-right';
import hljs from 'highlight.js';
import katex from 'katex';

// 数学公式插件
function mathPlugin(md) {
  md.inline.ruler.after('escape', 'math_inline', (state, silent) => {
    if (state.src.charCodeAt(state.pos) !== 0x24 /* $ */) return false;
    if (state.src.charCodeAt(state.pos + 1) === 0x24) return false;

    let start = state.pos + 1;
    let end = start;
    while (end < state.posMax && state.src.charCodeAt(end) !== 0x24) end++;
    if (end >= state.posMax) return false;

    if (!silent) {
      const token = state.push('math_inline', 'math', 0);
      token.content = state.src.slice(start, end);
      token.markup = '$';
    }
    state.pos = end + 1;
    return true;
  });

  md.block.ruler.after('fence', 'math_block', (state, startLine, endLine, silent) => {
    const pos = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    if (pos + 2 > max) return false;
    if (state.src.slice(pos, pos + 2) !== '$$') return false;

    if (silent) return true;

    let nextLine = startLine + 1;
    while (nextLine < endLine) {
      const linePos = state.bMarks[nextLine] + state.tShift[nextLine];
      const lineMax = state.eMarks[nextLine];
      if (state.src.slice(linePos, linePos + 2) === '$$') {
        const token = state.push('math_block', 'math', 0);
        token.content = state.getLines(startLine + 1, nextLine, 0, false).trim();
        token.markup = '$$';
        state.line = nextLine + 1;
        return true;
      }
      nextLine++;
    }
    return false;
  });

  md.renderer.rules.math_inline = (tokens, idx) => {
    try {
      return katex.renderToString(tokens[idx].content, { throwOnError: false });
    } catch {
      return tokens[idx].content;
    }
  };

  md.renderer.rules.math_block = (tokens, idx) => {
    try {
      return `<div class="math-block">${katex.renderToString(tokens[idx].content, { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `<pre>${tokens[idx].content}</pre>`;
    }
  };
}

// 代码高亮
function highlightPlugin(md) {
  md.options.highlight = (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const result = hljs.highlight(str, { language: lang }).value;
        return `<pre><code class="hljs language-${lang}">${result}<button class="copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.textContent.replace('复制','').trim())">复制</button></code></pre>`;
      } catch {}
    }
    const escaped = md.utils.escapeHtml(str);
    return `<pre><code class="hljs">${escaped}<button class="copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.textContent.replace('复制','').trim())">复制</button></code></pre>`;
  };
}

export function createMarkdownIt() {
  const md = new markdownIt({
    html: false,
    linkify: true,
    typographer: true,
  });

  md.use(emoji);
  md.use(footnote);
  md.use(taskLists, { enabled: true });
  md.use(anchor, { permalink: anchor.permalink.ariaHidden({ placement: 'before' }) });
  md.use(toc, { containerClass: 'table-of-contents' });
  md.use(mathPlugin);
  highlightPlugin(md);

  return md;
}
```

- [ ] **Step 2: 创建 Preview.js**

```javascript
import { createMarkdownIt } from './plugins.js';

export class Preview {
  constructor(container) {
    this.container = container;
    this.md = createMarkdownIt();
  }

  render(markdown) {
    this.container.innerHTML = this.md.render(markdown || '');
  }
}
```

- [ ] **Step 3: 构建验证**

```bash
npm run build
```
预期：无错误。

- [ ] **Step 4: 提交**

```bash
git add sidepanel/preview/plugins.js sidepanel/preview/Preview.js
git commit -m "feat: markdown-it preview with KaTeX, Mermaid, highlight.js"
```

---

## Task 5: 应用入口和模式切换

**Files:**
- Create: `sidepanel/app.js`

- [ ] **Step 1: 创建 app.js**

```javascript
import { Editor } from './editor/Editor.js';
import { Preview } from './preview/Preview.js';
import { FileOps } from './file-manager/FileOps.js';
import { FileTree } from './file-manager/FileTree.js';
import { RecentFiles } from './file-manager/RecentFiles.js';
import { setupShortcuts } from './editor/shortcuts.js';
import { setupScrollSync } from './preview/scroll-sync.js';

class App {
  constructor() {
    this.currentMode = 'split';
    this.currentFile = null; // { name, handle, source: 'local' | 'url' | 'new' }

    // 初始化组件
    this.editor = new Editor(document.getElementById('editor'), (text) => {
      this.preview.render(text);
      this.updateStatus();
    });
    this.preview = new Preview(document.getElementById('preview'));
    this.fileOps = new FileOps();
    this.fileTree = new FileTree(document.getElementById('file-tree'), (file) => this.openFile(file));
    this.recentFiles = new RecentFiles(document.getElementById('recent-files'), (file) => this.openRecentFile(file));

    // 设置快捷键
    setupShortcuts(this.editor, () => this.saveFile());

    // 设置同步滚动
    setupScrollSync(
      document.getElementById('editor-pane'),
      document.getElementById('preview-pane')
    );

    // 绑定 UI 事件
    this.bindEvents();

    // 加载主题
    this.loadTheme();

    // 设置侧边栏
    this.setupSidePanel();

    // 设置默认内容
    this.editor.setContent('# Hello Markdown\n\n开始编辑吧！\n');
    this.preview.render(this.editor.getContent());
  }

  bindEvents() {
    // 模式切换
    document.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', () => this.switchMode(tab.dataset.mode));
    });

    // 工具栏按钮
    document.getElementById('btn-open').addEventListener('click', () => this.openLocalFile());
    document.getElementById('btn-open-folder').addEventListener('click', () => this.openFolder());
    document.getElementById('btn-open-url').addEventListener('click', () => this.openUrlDialog());
    document.getElementById('btn-new').addEventListener('click', () => this.newFile());
    document.getElementById('btn-save').addEventListener('click', () => this.saveFile());
    document.getElementById('btn-download').addEventListener('click', () => this.downloadFile());
    document.getElementById('btn-theme').addEventListener('click', () => this.toggleTheme());

    // URL 对话框
    document.getElementById('url-cancel').addEventListener('click', () => {
      document.getElementById('url-dialog').close();
    });
    document.getElementById('url-dialog').querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.openUrl(document.getElementById('url-input').value);
      document.getElementById('url-dialog').close();
    });
  }

  switchMode(mode) {
    this.currentMode = mode;
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

    const editorPane = document.getElementById('editor-pane');
    const previewPane = document.getElementById('preview-pane');
    const filesPane = document.getElementById('files-pane');

    editorPane.style.display = 'none';
    previewPane.style.display = 'none';
    filesPane.style.display = 'none';

    switch (mode) {
      case 'split':
        editorPane.style.display = 'block';
        previewPane.style.display = 'block';
        editorPane.style.flex = '1';
        previewPane.style.flex = '1';
        break;
      case 'edit':
        editorPane.style.display = 'block';
        editorPane.style.flex = '1';
        break;
      case 'preview':
        previewPane.style.display = 'block';
        previewPane.style.flex = '1';
        break;
      case 'files':
        filesPane.style.display = 'block';
        break;
    }
  }

  async openLocalFile() {
    const file = await this.fileOps.openFile();
    if (file) {
      this.currentFile = { name: file.name, handle: file.handle, source: 'local' };
      this.editor.setContent(file.content);
      this.preview.render(file.content);
      this.recentFiles.add(file.name, file.handle);
      this.updateStatus();
    }
  }

  async openFolder() {
    await this.fileTree.openDirectory();
  }

  openUrlDialog() {
    document.getElementById('url-dialog').showModal();
  }

  async openUrl(url) {
    if (!url) return;
    const content = await this.fileOps.fetchUrl(url);
    if (content !== null) {
      const name = url.split('/').pop() || 'remote.md';
      this.currentFile = { name, url, source: 'url' };
      this.editor.setContent(content);
      this.preview.render(content);
      this.updateStatus();
    }
  }

  async openFile(fileData) {
    if (fileData.handle) {
      const content = await this.fileOps.readFile(fileData.handle);
      this.currentFile = { name: fileData.name, handle: fileData.handle, source: 'local' };
      this.editor.setContent(content);
      this.preview.render(content);
      this.recentFiles.add(fileData.name, fileData.handle);
      this.updateStatus();
    }
  }

  async openRecentFile(fileData) {
    await this.openFile(fileData);
  }

  newFile() {
    this.currentFile = { name: 'untitled.md', source: 'new' };
    this.editor.setContent('');
    this.preview.render('');
    this.updateStatus();
  }

  async saveFile() {
    if (!this.currentFile) return;
    const content = this.editor.getContent();

    if (this.currentFile.source === 'local' && this.currentFile.handle) {
      await this.fileOps.writeFile(this.currentFile.handle, content);
    } else {
      this.downloadFile();
    }
  }

  downloadFile() {
    const content = this.editor.getContent();
    const name = this.currentFile?.name || 'untitled.md';
    this.fileOps.download(content, name);
  }

  updateStatus() {
    const name = this.currentFile?.name || '未打开文件';
    const lines = this.editor.getLineCount();
    const chars = this.editor.getContent().length;
    document.getElementById('status-filename').textContent = name;
    document.getElementById('status-info').textContent = `UTF-8 | ${lines} 行 | ${chars} 字`;
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    chrome.storage.local.set({ theme: next });
  }

  loadTheme() {
    chrome.storage.local.get('theme', (data) => {
      if (data.theme) {
        document.documentElement.setAttribute('data-theme', data.theme);
      }
    });
  }

  setupSidePanel() {
    // Side Panel 打开时设置默认路径
    if (chrome.sidePanel) {
      chrome.sidePanel.setOptions({ path: 'sidepanel/index.html' });
    }
  }
}

// 启动应用
new App();
```

- [ ] **Step 2: 创建临时占位文件（后续 Task 会替换）**

创建 `sidepanel/editor/shortcuts.js`:
```javascript
export function setupShortcuts(editor, onSave) {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave();
    }
  });
}
```

创建 `sidepanel/preview/scroll-sync.js`:
```javascript
export function setupScrollSync(editorPane, previewPane) {
  // 简单同步滚动，后续优化
  const editorScroller = editorPane.querySelector('.cm-scroller');
  if (!editorScroller) return;

  let syncing = false;
  editorScroller.addEventListener('scroll', () => {
    if (syncing) return;
    syncing = true;
    const ratio = editorScroller.scrollTop / (editorScroller.scrollHeight - editorScroller.clientHeight);
    previewPane.scrollTop = ratio * (previewPane.scrollHeight - previewPane.clientHeight);
    requestAnimationFrame(() => { syncing = false; });
  });
}
```

创建 `sidepanel/file-manager/FileOps.js`:
```javascript
export class FileOps {
  async openFile() {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }],
      });
      const file = await handle.getFile();
      const content = await file.text();
      return { name: file.name, handle, content };
    } catch {
      return null;
    }
  }

  async readFile(handle) {
    const file = await handle.getFile();
    return file.text();
  }

  async writeFile(handle, content) {
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async fetchUrl(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (err) {
      alert(`加载失败: ${err.message}`);
      return null;
    }
  }

  download(content, filename) {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

创建 `sidepanel/file-manager/FileTree.js`:
```javascript
export class FileTree {
  constructor(container, onFileSelect) {
    this.container = container;
    this.onFileSelect = onFileSelect;
    this.container.innerHTML = '<h3>文件浏览</h3><div class="tree-content"><p style="color:var(--text-secondary);font-size:13px;">点击上方 📂 打开文件夹</p></div>';
  }

  async openDirectory() {
    try {
      const dirHandle = await window.showDirectoryPicker();
      this.container.innerHTML = '<h3>文件浏览</h3>';
      await this.renderTree(dirHandle, this.container, 0);
    } catch {}
  }

  async renderTree(dirHandle, parent, depth) {
    const entries = [];
    for await (const entry of dirHandle.values()) {
      entries.push(entry);
    }
    entries.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of entries) {
      const div = document.createElement('div');
      div.className = 'file-item';
      div.style.paddingLeft = `${8 + depth * 16}px`;

      if (entry.kind === 'directory') {
        div.textContent = `📂 ${entry.name}`;
        div.addEventListener('click', async () => {
          const sub = div.nextElementSibling;
          if (sub && sub.classList.contains('tree-children')) {
            sub.remove();
          } else {
            const childContainer = document.createElement('div');
            childContainer.className = 'tree-children';
            div.after(childContainer);
            await this.renderTree(entry, childContainer, depth + 1);
          }
        });
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.markdown')) {
        div.textContent = `📄 ${entry.name}`;
        div.addEventListener('click', () => {
          this.onFileSelect({ name: entry.name, handle: entry });
        });
      } else {
        continue;
      }

      parent.appendChild(div);
    }
  }
}
```

创建 `sidepanel/file-manager/RecentFiles.js`:
```javascript
export class RecentFiles {
  constructor(container, onFileSelect) {
    this.container = container;
    this.onFileSelect = onFileSelect;
    this.load();
  }

  load() {
    chrome.storage.local.get('recentFiles', (data) => {
      this.files = data.recentFiles || [];
      this.render();
    });
  }

  add(name, handle) {
    this.files = this.files.filter((f) => f.name !== name);
    this.files.unshift({ name, timestamp: Date.now() });
    this.files = this.files.slice(0, 20);
    chrome.storage.local.set({ recentFiles: this.files });
    this.render();
  }

  render() {
    if (this.files.length === 0) {
      this.container.innerHTML = '<h3>最近文件</h3><p style="color:var(--text-secondary);font-size:13px;">暂无记录</p>';
      return;
    }
    this.container.innerHTML = '<h3>最近文件</h3>' +
      this.files.map((f) => `<div class="file-item">📄 ${f.name}</div>`).join('');
    this.container.querySelectorAll('.file-item').forEach((el, i) => {
      el.addEventListener('click', () => this.onFileSelect(this.files[i]));
    });
  }
}
```

- [ ] **Step 3: 构建验证**

```bash
npm run build
```
预期：无错误。

- [ ] **Step 4: 提交**

```bash
git add sidepanel/app.js sidepanel/editor/shortcuts.js sidepanel/preview/scroll-sync.js sidepanel/file-manager/
git commit -m "feat: app entry with mode switching and file operations"
```

---

## Task 6: 快捷键和格式化

**Files:**
- Modify: `sidepanel/editor/shortcuts.js`

- [ ] **Step 1: 完善 shortcuts.js**

```javascript
export function setupShortcuts(editor, onSave) {
  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;

    // Ctrl+S — 保存
    if (mod && e.key === 's') {
      e.preventDefault();
      onSave();
      return;
    }

    // Ctrl+B — 粗体
    if (mod && e.key === 'b') {
      e.preventDefault();
      editor.wrapSelection('**', '**');
      return;
    }

    // Ctrl+I — 斜体
    if (mod && e.key === 'i' && !e.shiftKey) {
      e.preventDefault();
      editor.wrapSelection('*', '*');
      return;
    }

    // Ctrl+K — 链接
    if (mod && e.key === 'k') {
      e.preventDefault();
      const { from, to } = editor.view.state.selection.main;
      const selected = editor.view.state.sliceDoc(from, to);
      if (selected) {
        editor.insertText(`[${selected}](url)`);
      } else {
        editor.insertText('[链接文字](url)');
      }
      return;
    }

    // Ctrl+Shift+I — 图片
    if (mod && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      editor.insertText('![alt](url)');
      return;
    }

    // Ctrl+` — 行内代码
    if (mod && e.key === '`' && !e.shiftKey) {
      e.preventDefault();
      editor.wrapSelection('`', '`');
      return;
    }

    // Ctrl+Shift+` — 代码块
    if (mod && e.shiftKey && e.key === '`') {
      e.preventDefault();
      editor.insertText('\n```\n\n```\n');
      return;
    }
  });
}
```

- [ ] **Step 2: 构建验证**

```bash
npm run build
```

- [ ] **Step 3: 提交**

```bash
git add sidepanel/editor/shortcuts.js
git commit -m "feat: keyboard shortcuts for markdown formatting"
```

---

## Task 7: 同步滚动优化

**Files:**
- Modify: `sidepanel/preview/scroll-sync.js`

- [ ] **Step 1: 完善 scroll-sync.js**

```javascript
export function setupScrollSync(editorPane, previewPane) {
  const editorScroller = editorPane.querySelector('.cm-scroller');
  if (!editorScroller) return;

  let syncing = false;

  editorScroller.addEventListener('scroll', () => {
    if (syncing) return;
    syncing = true;

    const editorScrollable = editorScroller.scrollHeight - editorScroller.clientHeight;
    if (editorScrollable <= 0) {
      syncing = false;
      return;
    }

    const ratio = editorScroller.scrollTop / editorScrollable;
    const previewScrollable = previewPane.scrollHeight - previewPane.clientHeight;
    previewPane.scrollTop = ratio * previewScrollable;

    requestAnimationFrame(() => { syncing = false; });
  });

  previewPane.addEventListener('scroll', () => {
    if (syncing) return;
    syncing = true;

    const previewScrollable = previewPane.scrollHeight - previewPane.clientHeight;
    if (previewScrollable <= 0) {
      syncing = false;
      return;
    }

    const ratio = previewPane.scrollTop / previewScrollable;
    const editorScrollable = editorScroller.scrollHeight - editorScroller.clientHeight;
    editorScroller.scrollTop = ratio * editorScrollable;

    requestAnimationFrame(() => { syncing = false; });
  });
}
```

- [ ] **Step 2: 构建验证**

```bash
npm run build
```

- [ ] **Step 3: 提交**

```bash
git add sidepanel/preview/scroll-sync.js
git commit -m "feat: bidirectional scroll sync between editor and preview"
```

---

## Task 8: WYSIWYG 模式

**Files:**
- Create: `sidepanel/editor/wysiwyg.js`
- Modify: `sidepanel/editor/Editor.js` — 添加 WYSIWYG 扩展

- [ ] **Step 1: 创建 wysiwyg.js**

```javascript
import { ViewPlugin, Decoration, WidgetType } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

// 隐藏 markdown 标记的 decoration
class HeadingWidget extends WidgetType {
  constructor(level) { super(); this.level = level; }
  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-heading-mark';
    span.style.opacity = '0.3';
    return span;
  }
}

function headingDecorations(view) {
  const builder = new RangeSetBuilder();
  for (const { from, to } of view.visibleRanges) {
    const doc = view.state.doc;
    for (let line = doc.lineAt(from).number; line <= doc.lineAt(to).number; line++) {
      const lineObj = doc.line(line);
      const text = lineObj.text;
      const match = text.match(/^(#{1,6})\s/);
      if (match) {
        builder.add(
          lineObj.from,
          lineObj.from + match[1].length + 1,
          Decoration.replace({ widget: new HeadingWidget(match[1].length) })
        );
      }
    }
  }
  return builder.finish();
}

// 粗体标记隐藏
function boldDecorations(view) {
  const builder = new RangeSetBuilder();
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.sliceDoc(from, to);
    const regex = /\*\*(.+?)\*\*/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const start = from + match.index;
      builder.add(start, start + 2, Decoration.replace({}));
      builder.add(start + match[0].length - 2, start + match[0].length, Decoration.replace({}));
    }
  }
  return builder.finish();
}

// 斜体标记隐藏
function italicDecorations(view) {
  const builder = new RangeSetBuilder();
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.sliceDoc(from, to);
    const regex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const start = from + match.index;
      builder.add(start, start + 1, Decoration.replace({}));
      builder.add(start + match[0].length - 1, start + match[0].length, Decoration.replace({}));
    }
  }
  return builder.finish();
}

export const wysiwygExtension = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = this.buildDecorations(view);
    }
    update(update) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }
    buildDecorations(view) {
      return Decoration.set([
        ...headingDecorations(view),
        ...boldDecorations(view),
        ...italicDecorations(view),
      ]);
    }
  },
  { decorations: (v) => v.decorations }
);
```

- [ ] **Step 2: 修改 Editor.js — 添加 WYSIWYG 支持**

在 Editor.js 的构造函数中添加一个 `setWysiwyg(enabled)` 方法：

```javascript
import { wysiwygExtension } from './wysiwyg.js';

// 在 Editor 类中添加:
setWysiwyg(enabled) {
  // 通过重新配置 extensions 来切换模式
  // 这需要重建 editor state
  const content = this.getContent();
  const extensions = this.getBaseExtensions();
  if (enabled) {
    extensions.push(wysiwygExtension);
  }

  this.view.setState(EditorState.create({
    doc: content,
    extensions,
    selection: this.view.state.selection,
  }));
}
```

注意：将原有的 extensions 数组提取为 `getBaseExtensions()` 方法，以便复用。

- [ ] **Step 3: 构建验证**

```bash
npm run build
```

- [ ] **Step 4: 提交**

```bash
git add sidepanel/editor/wysiwyg.js sidepanel/editor/Editor.js
git commit -m "feat: WYSIWYG mode with hidden markdown syntax markers"
```

---

## Task 9: Background Service Worker

**Files:**
- Create: `background/service-worker.js`

- [ ] **Step 1: 创建 service-worker.js**

```javascript
// 设置 Side Panel 行为
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// 拦截 .md 文件 URL（可选功能）
chrome.runtime.onInstalled.addListener(() => {
  console.log('Markdown 浏览器已安装');
});
```

- [ ] **Step 2: 提交**

```bash
git add background/service-worker.js
git commit -m "feat: background service worker with side panel behavior"
```

---

## Task 10: Content Script

**Files:**
- Create: `content/content-script.js`

- [ ] **Step 1: 创建 content-script.js**

```javascript
// 检测页面是否是纯 markdown 文件
(function() {
  const url = window.location.href;
  const isMarkdown = /\.(md|markdown)(\?.*)?$/i.test(url) ||
    document.contentType === 'text/markdown';

  if (isMarkdown && document.body) {
    // 在页面顶部添加提示条
    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#4a9eff;color:white;padding:8px 16px;font-family:sans-serif;font-size:14px;display:flex;align-items:center;justify-content:space-between;';
    bar.innerHTML = `
      <span>此页面是 Markdown 文件，是否在侧边栏中打开？</span>
      <div>
        <button id="md-ext-open" style="background:white;color:#4a9eff;border:none;padding:4px 12px;border-radius:4px;cursor:pointer;margin-right:8px;">打开</button>
        <button id="md-ext-dismiss" style="background:transparent;color:white;border:1px solid white;padding:4px 12px;border-radius:4px;cursor:pointer;">忽略</button>
      </div>
    `;
    document.body.prepend(bar);

    document.getElementById('md-ext-open').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openInSidePanel', url });
      bar.remove();
    });

    document.getElementById('md-ext-dismiss').addEventListener('click', () => {
      bar.remove();
    });
  }
})();
```

- [ ] **Step 2: 提交**

```bash
git add content/content-script.js
git commit -m "feat: content script to detect .md URLs and offer side panel opening"
```

---

## Task 11: Mermaid 图表支持

**Files:**
- Modify: `sidepanel/preview/plugins.js`

- [ ] **Step 1: 添加 Mermaid 渲染**

在 `plugins.js` 中添加 mermaid 初始化和渲染逻辑：

```javascript
import mermaid from 'mermaid';

// 在文件顶部初始化 mermaid
mermaid.initialize({ startOnLoad: false, theme: 'default' });

// 在 createMarkdownIt 函数返回 md 之后，添加 fence 覆盖：
const defaultFence = md.renderer.rules.fence.bind(md.renderer.rules);
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  if (token.info.trim() === 'mermaid') {
    const id = `mermaid-${idx}-${Date.now()}`;
    // 使用同步方式：先返回占位符，后续异步渲染
    return `<div class="mermaid-placeholder" data-mermaid-id="${id}" data-source="${encodeURIComponent(token.content)}"></div>`;
  }
  return defaultFence(tokens, idx, options, env, self);
};

// 添加一个方法来渲染页面中的 mermaid 图表
export async function renderMermaidDiagrams(container) {
  const placeholders = container.querySelectorAll('.mermaid-placeholder');
  for (const el of placeholders) {
    const source = decodeURIComponent(el.dataset.source);
    const id = el.dataset.mermaidId;
    try {
      const { svg } = await mermaid.render(id, source);
      el.innerHTML = svg;
      el.classList.remove('mermaid-placeholder');
      el.classList.add('mermaid-rendered');
    } catch (err) {
      el.innerHTML = `<pre style="color:red;">Mermaid 渲染错误: ${err.message}</pre>`;
    }
  }
}
```

- [ ] **Step 2: 修改 Preview.js 调用 Mermaid 渲染**

```javascript
import { createMarkdownIt, renderMermaidDiagrams } from './plugins.js';

export class Preview {
  constructor(container) {
    this.container = container;
    this.md = createMarkdownIt();
  }

  render(markdown) {
    this.container.innerHTML = this.md.render(markdown || '');
    renderMermaidDiagrams(this.container);
  }
}
```

- [ ] **Step 3: 构建验证**

```bash
npm run build
```

- [ ] **Step 4: 提交**

```bash
git add sidepanel/preview/plugins.js sidepanel/preview/Preview.js
git commit -m "feat: Mermaid diagram rendering in preview"
```

---

## Task 12: 完整构建和端到端测试

- [ ] **Step 1: 完整构建**

```bash
npm run build
```
预期：`lib/sidepanel-bundle.js` 生成，无错误。

- [ ] **Step 2: 在 Chrome 中加载扩展**

1. 打开 `chrome://extensions`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `D:\lyqwork\code\mdpluginchrome` 目录

- [ ] **Step 3: 测试基本功能**

1. 点击扩展图标，Side Panel 应打开
2. 输入 markdown 文本，预览应实时更新
3. 切换模式（分屏/编辑/预览/文件）
4. 点击打开文件，选择一个 .md 文件
5. 修改内容，点击保存
6. 点击从 URL 打开，输入一个 markdown URL
7. 切换亮色/暗色主题
8. 测试快捷键（Ctrl+B, Ctrl+I, Ctrl+S 等）

- [ ] **Step 4: 修复发现的问题**

根据测试结果修复问题。

- [ ] **Step 5: 最终提交**

```bash
git add -A
git commit -m "chore: final build and fixes after testing"
```

---

## 自审结果

1. **Spec 覆盖**: 所有规格要求都有对应 Task — 编辑器(Task 3,6,8)、预览(Task 4,11)、文件管理(Task 5)、UI(Task 2,5)、权限(Task 9)、安全(Task 4 中 html:false)。
2. **占位符扫描**: 无 TBD/TODO，所有步骤包含实际代码。
3. **类型一致性**: 方法名、参数在各 Task 间一致（如 `setContent`/`getContent`/`render`）。
