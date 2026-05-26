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
