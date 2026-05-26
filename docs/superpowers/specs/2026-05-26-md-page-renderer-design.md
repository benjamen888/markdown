# Markdown 页面渲染器 — 设计文档

## 概述

增强 Content Script，当浏览器打开 `.md` 文件时，自动将原始文本替换为格式化的 markdown 预览。提供预览/源码/编辑/原始四种模式，以及打开 Side Panel 完整编辑器的入口。

## 功能需求

### 自动检测与渲染

- 检测 URL 以 `.md`/`.markdown` 结尾，或 `contentType` 为 `text/markdown`
- 默认自动将页面内容替换为渲染后的 markdown 预览
- 提供按钮可切换回浏览器默认的原始文本显示

### 四种显示模式

| 模式 | 说明 | 交互 |
|------|------|------|
| 预览（默认） | 渲染后的 markdown，只读 | 可滚动、复制文本 |
| 源码 | 原始 markdown 文本 | 只读 |
| 编辑 | 左侧 textarea 编辑源码，右侧实时预览 | 可编辑、可下载保存 |
| 原始 | 恢复浏览器默认纯文本显示 | 原始行为 |

### 浮动工具栏

- 固定在页面顶部，z-index 最高
- 四个模式切换按钮：预览、源码、编辑、原始
- 「在 Side Panel 打开」按钮
- 可收起/展开

### 编辑模式

- 左侧：textarea 等宽字体编辑器
- 右侧：实时 markdown 预览（复用 markdown-it 渲染）
- 底部：保存/下载按钮

## 技术方案

### 架构

```
content/
├── content-script.js       — 入口，检测 .md 文件，注入渲染器
├── renderer/
│   ├── PageRenderer.js     — 主控制器，管理模式切换
│   ├── Toolbar.js          — 浮动工具栏
│   ├── PreviewMode.js      — 预览模式（渲染 markdown）
│   ├── SourceMode.js        — 源码模式（显示原始文本）
│   ├── EditMode.js          — 编辑模式（textarea + 预览）
│   └── styles.js            — 注入的 CSS 样式
```

### 渲染引擎

- 复用 `sidepanel/preview/plugins.js` 中的 `createMarkdownIt()` 函数
- 将 plugins.js 提取为共享模块，content script 和 side panel 都引用
- esbuild 构建两个入口：`sidepanel/app.js` 和 `content/content-script.js`

### 页面注入流程

1. Content Script 检测到 .md 文件
2. 保存原始 `document.body.innerHTML`
3. 清空 body，注入工具栏 + 预览容器
4. 获取页面原始文本（`document.body.innerText` 或 fetch URL）
5. 使用 markdown-it 渲染并显示

### 样式隔离

- 所有注入的样式使用 `md-ext-` 前缀避免冲突
- 使用 CSS 变量支持亮色/暗色
- 工具栏使用 `position: fixed` 不影响页面滚动

### 权限

- 不需要额外权限，现有 `content_scripts` 和 `host_permissions` 已覆盖

## 依赖

- markdown-it 及其插件（已安装）
- KaTeX（已安装）
- highlight.js（已安装）
- Mermaid（已安装）

## 构建

- esbuild 多入口构建：
  - `sidepanel/app.js` → `lib/sidepanel-bundle.js`
  - `content/content-script.js` → `lib/content-bundle.js`
- 共享模块（plugins.js）自动被 esbuild 提取为共享 chunk
