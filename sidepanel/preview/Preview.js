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
