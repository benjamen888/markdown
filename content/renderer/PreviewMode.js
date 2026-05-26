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
