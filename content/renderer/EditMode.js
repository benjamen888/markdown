import { createMarkdownIt, renderMermaidDiagrams } from '../../shared/md-engine.js';

export class EditMode {
  constructor() {
    this.md = createMarkdownIt();
    this.element = this.create();
  }

  create() {
    const container = document.createElement('div');
    container.className = 'md-ext-edit-area';

    // 左侧编辑区
    const left = document.createElement('div');
    left.className = 'md-ext-edit-left';

    const toolbar = document.createElement('div');
    toolbar.className = 'md-ext-edit-toolbar';

    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = '下载';
    downloadBtn.addEventListener('click', () => this.download());

    const saveBtn = document.createElement('button');
    saveBtn.textContent = '保存';
    saveBtn.addEventListener('click', () => this.save());

    toolbar.appendChild(saveBtn);
    toolbar.appendChild(downloadBtn);

    this.textarea = document.createElement('textarea');
    this.textarea.placeholder = '输入 Markdown 内容...';
    this.textarea.addEventListener('input', () => this.updatePreview());

    left.appendChild(toolbar);
    left.appendChild(this.textarea);

    // 右侧预览区
    const right = document.createElement('div');
    right.className = 'md-ext-edit-right md-ext-container';
    this.previewContainer = right;

    container.appendChild(left);
    container.appendChild(right);

    return container;
  }

  render(markdown) {
    this.textarea.value = markdown || '';
    this.updatePreview();
  }

  updatePreview() {
    const text = this.textarea.value;
    this.previewContainer.innerHTML = this.md.render(text || '');
    renderMermaidDiagrams(this.previewContainer);
  }

  download() {
    const content = this.textarea.value;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = document.title.replace(/\.[^.]+$/, '') + '.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  save() {
    this.download();
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
