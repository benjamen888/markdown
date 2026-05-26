import markdownIt from 'markdown-it';
import { full as emoji } from 'markdown-it-emoji';
import footnote from 'markdown-it-footnote';
import taskLists from 'markdown-it-task-lists';
import anchor from 'markdown-it-anchor';
import toc from 'markdown-it-toc-done-right';
import hljs from 'highlight.js';
import katex from 'katex';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false, theme: 'default' });

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

  const defaultFence = md.renderer.rules.fence.bind(md.renderer.rules);
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    if (token.info.trim() === 'mermaid') {
      const id = `mermaid-${idx}-${Date.now()}`;
      return `<div class="mermaid-placeholder" data-mermaid-id="${id}" data-source="${encodeURIComponent(token.content)}"></div>`;
    }
    return defaultFence(tokens, idx, options, env, self);
  };

  return md;
}

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
