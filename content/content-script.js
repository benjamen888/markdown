(function() {
  const url = window.location.href;
  const isMarkdown = /\.(md|markdown)(\?.*)?$/i.test(url) ||
    document.contentType === 'text/markdown';

  if (!isMarkdown) return;

  function init() {
    const text = document.body.innerText;
    if (!text || text.trim().length === 0) {
      setTimeout(init, 100);
      return;
    }

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
