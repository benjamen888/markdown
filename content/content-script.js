import { PageRenderer } from './renderer/PageRenderer.js';

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

    const renderer = new PageRenderer(text, url);
    renderer.render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
