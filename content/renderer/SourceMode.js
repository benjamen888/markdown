export class SourceMode {
  constructor() {
    this.element = document.createElement('pre');
    this.element.className = 'md-ext-source';
  }

  render(markdown) {
    this.element.textContent = markdown || '';
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
