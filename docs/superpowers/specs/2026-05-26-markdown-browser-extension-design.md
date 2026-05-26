# Markdown 浏览器 Chrome 扩展 — 设计文档

## 概述

一个 Chrome 扩展，通过 Side Panel 提供完整的 Markdown 文件浏览和编辑能力。支持本地文件、远程 URL、内置编辑器三种来源，提供 WYSIWYG 和源码双模式编辑，以及完整特性的 Markdown 预览。

## 技术选型

| 组件 | 技术 | 理由 |
|------|------|------|
| 编辑器 | CodeMirror 6 | 现代、轻量、可扩展，Decoration API 支持 WYSIWYG |
| Markdown 解析 | markdown-it | 插件生态丰富，性能好 |
| 数学公式 | KaTeX | 比 MathJax 更快 |
| 流程图 | Mermaid | 开源标准，支持多种图表 |
| 代码高亮 | highlight.js | 100+ 语言支持 |
| 容器 | Chrome Side Panel API | 持久面板，用户友好 |

## 架构

```
manifest.json (Manifest V3)
│
├── sidepanel/
│   ├── index.html          — 主页面
│   ├── app.js              — 应用入口
│   ├── editor/
│   │   ├── Editor.js       — CodeMirror 6 编辑器封装
│   │   ├── wysiwyg.js      — WYSIWYG 模式 (Decoration)
│   │   └── shortcuts.js    — 快捷键绑定
│   ├── preview/
│   │   ├── Preview.js      — markdown-it 渲染器
│   │   ├── plugins.js      — KaTeX/Mermaid/highlight 插件链
│   │   └── scroll-sync.js  — 同步滚动
│   ├── file-manager/
│   │   ├── FileTree.js     — 文件树组件
│   │   ├── RecentFiles.js  — 最近文件列表
│   │   └── FileOps.js      — 文件读写操作
│   └── styles/
│       ├── main.css
│       └── themes/         — 亮色/暗色主题
│
├── background/
│   └── service-worker.js   — 后台逻辑，URL 拦截
│
└── content/
    └── content-script.js   — 可选，拦截 .md URL
```

## UI 设计

### Side Panel 布局

顶部工具栏，下方为编辑/预览区域。

**模式切换标签：**
- 分屏模式：上方编辑器，下方预览（默认）
- 纯编辑模式：全屏 CodeMirror
- 纯预览模式：全屏渲染结果
- 文件模式：显示文件树 + 最近文件

**底部状态栏：** 文件名、编码、行数、字数、保存/下载按钮

### 文件浏览器

分为两个区域：
1. **最近文件** — 最近 20 个打开过的文件，点击直接打开
2. **文件树** — 用户选择的文件夹，递归列出 .md 文件，支持点击打开

## 编辑器

### 双模式

**WYSIWYG 模式：**
- 使用 CodeMirror 6 的 `Decoration` API 隐藏 markdown 标记符号
- 标记在光标靠近时临时显示，离开后隐藏
- 图片直接内联渲染
- 链接显示为可点击文本

**源码模式：**
- 标准 CodeMirror 6 markdown 语法高亮
- 行号显示
- 括号/引号自动配对

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+B | 粗体 |
| Ctrl+I | 斜体 |
| Ctrl+K | 插入链接 |
| Ctrl+Shift+I | 插入图片 |
| Ctrl+` | 行内代码 |
| Ctrl+Shift+` | 代码块 |
| Ctrl+S | 保存 |
| Ctrl+Z | 撤销 |
| Ctrl+Shift+Z | 重做 |
| Ctrl+F | 查找 |
| Ctrl+H | 替换 |

### 自动补全

- 链接路径：从文件树中匹配已有文件
- Emoji：输入 `:` 触发 emoji 列表

## 预览

### markdown-it 插件链

```
markdown-it (核心解析, html: false)
├── markdown-it-emoji          → :smile: 等 emoji
├── markdown-it-footnotes      → [^1] 脚注
├── markdown-it-task-lists     → - [x] 任务列表
├── markdown-it-anchor         → 标题锚点
├── markdown-it-toc            → [TOC] 目录生成
├── KaTeX                      → $E=mc^2$ 数学公式
├── highlight.js               → 代码块语法高亮
└── Mermaid                    → 流程图/时序图
```

### 渲染特性

- 代码块：100+ 语言语法高亮，带复制按钮
- 表格：支持对齐，样式美化
- 图片：本地相对路径、URL、base64
- 目录：从标题自动生成，可点击跳转
- 主题：亮色/暗色切换

### 同步滚动

- 编辑区滚动 → 预览区按比例跟随
- 光标所在段落在预览区高亮
- 可通过按钮开关同步

## 文件管理

### 来源处理

| 来源 | 打开方式 | 保存方式 |
|------|---------|---------|
| 本地文件 | `showOpenFilePicker()` | `FileSystemWritableFileStream` 写回原文件 |
| 文件夹 | `showDirectoryPicker()` | 文件树浏览，点击文件打开 |
| URL 远程 | `fetch` 获取 | 下载为 .md 文件 |
| 新建 | 空白文档 | 下载为 .md 文件 |

### File System Access API 权限

- 用户通过 picker 选择文件即授予读写权限，后续无需重复授权
- 可通过 `requestPermission()` 持久化，跨会话保留
- 文件夹权限覆盖其中所有文件

### 自动保存

- 本地文件：可选自动保存（默认关闭）
- 编辑状态：当前文件路径、光标位置、滚动位置保存在 `chrome.storage.session`，关闭重开恢复

### 最近文件

- 存储在 `chrome.storage.local`
- 保留最近 20 个文件的路径和最后打开时间
- 点击直接打开（本地文件需重新 picker，或使用持久化权限）

## 权限

```json
{
  "manifest_version": 3,
  "permissions": [
    "sidePanel",
    "storage",
    "activeTab"
  ],
  "host_permissions": ["<all_urls>"]
}
```

## 安全

- `markdown-it` 配置 `html: false`，所有 HTML 标签转义，防止 XSS
- 远程 URL 受 CORS 限制
- 本地文件写入通过 File System Access API，用户明确选择文件才可写
- 不注入外部脚本，所有渲染在插件沙箱内完成

## 依赖

```json
{
  "dependencies": {
    "@codemirror/view": "^6.x",
    "@codemirror/state": "^6.x",
    "@codemirror/lang-markdown": "^6.x",
    "@codemirror/language": "^6.x",
    "markdown-it": "^14.x",
    "markdown-it-emoji": "^3.x",
    "markdown-it-footnote": "^4.x",
    "markdown-it-task-lists": "^2.x",
    "markdown-it-anchor": "^9.x",
    "markdown-it-toc-done-right": "^4.x",
    "katex": "^0.16.x",
    "mermaid": "^11.x",
    "highlight.js": "^11.x"
  }
}
```

## 开发构建

- 无构建工具：直接使用 ES modules，Chrome 原生支持
- 开发时加载未打包扩展 (`chrome://extensions` → 加载已解压)
- 生产打包：zip 为 .crx 或上传 Chrome Web Store
