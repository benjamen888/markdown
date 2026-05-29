export class Toolbar {
  constructor(onModeChange, onOpenSidePanel, onExport) {
    this.onModeChange = onModeChange;
    this.onOpenSidePanel = onOpenSidePanel;
    this.onExport = onExport;
    this.currentMode = 'preview';
    this.element = this.create();
  }

  create() {
    const bar = document.createElement('div');
    bar.className = 'md-ext-toolbar';

    const title = document.createElement('span');
    title.className = 'md-ext-title';
    title.textContent = 'Markdown';

    const modes = ['preview', 'source', 'edit', 'raw'];
    const labels = { preview: '预览', source: '源码', edit: '编辑', raw: '原始' };

    this.buttons = {};
    for (const mode of modes) {
      const btn = document.createElement('button');
      btn.textContent = labels[mode];
      btn.dataset.mode = mode;
      if (mode === 'preview') btn.classList.add('active');
      btn.addEventListener('click', () => this.setMode(mode));
      this.buttons[mode] = btn;
    }

    // 导出按钮
    this.exportPngBtn = document.createElement('button');
    this.exportPngBtn.textContent = '📷 PNG';
    this.exportPngBtn.title = '导出为 PNG';
    this.exportPngBtn.addEventListener('click', () => this.onExport('png'));

    this.exportPdfBtn = document.createElement('button');
    this.exportPdfBtn.textContent = '📄 PDF';
    this.exportPdfBtn.title = '导出为 PDF';
    this.exportPdfBtn.addEventListener('click', () => this.onExport('pdf'));

    const spacer = document.createElement('div');
    spacer.className = 'md-ext-spacer';

    const openBtn = document.createElement('button');
    openBtn.textContent = '在 Side Panel 打开';
    openBtn.addEventListener('click', () => this.onOpenSidePanel());

    bar.appendChild(title);
    for (const mode of modes) {
      bar.appendChild(this.buttons[mode]);
    }
    bar.appendChild(this.exportPngBtn);
    bar.appendChild(this.exportPdfBtn);
    bar.appendChild(spacer);
    bar.appendChild(openBtn);

    return bar;
  }

  setMode(mode) {
    this.currentMode = mode;
    for (const [key, btn] of Object.entries(this.buttons)) {
      btn.classList.toggle('active', key === mode);
    }
    this.onModeChange(mode);
  }

  mount(parent) {
    parent.appendChild(this.element);
  }
}
