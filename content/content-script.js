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
