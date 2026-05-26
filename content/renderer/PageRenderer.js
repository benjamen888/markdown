import { injectStyles } from './styles.js';
import { Toolbar } from './Toolbar.js';
import { PreviewMode } from './PreviewMode.js';
import { SourceMode } from './SourceMode.js';
import { EditMode } from './EditMode.js';

export class PageRenderer {
  constructor(markdown, url) {
    this.markdown = markdown;
    this.url = url;
    this.originalBody = document.body.innerHTML;

    injectStyles();

    this.previewMode = new PreviewMode();
    this.sourceMode = new SourceMode();
    this.editMode = new EditMode();
    this.toolbar = new Toolbar(
      (mode) => this.switchMode(mode),
      () => this.openSidePanel()
    );

    this.modes = {
      preview: this.previewMode,
      source: this.sourceMode,
      edit: this.editMode,
    };
  }

  render() {
    document.body.innerHTML = '';
    this.toolbar.mount(document.body);
    this.previewMode.mount(document.body);
    this.sourceMode.mount(document.body);
    this.editMode.mount(document.body);
    this.previewMode.render(this.markdown);
    this.sourceMode.render(this.markdown);
    this.editMode.render(this.markdown);
    this.switchMode('preview');
  }

  switchMode(mode) {
    if (mode === 'raw') {
      this.restoreOriginal();
      return;
    }
    for (const [key, handler] of Object.entries(this.modes)) {
      if (key === mode) {
        handler.show();
      } else {
        handler.hide();
      }
    }
  }

  restoreOriginal() {
    document.body.innerHTML = this.originalBody;
    const bar = document.createElement('div');
    bar.className = 'md-ext-toolbar';
    const btn = document.createElement('button');
    btn.textContent = '返回预览';
    btn.classList.add('active');
    btn.addEventListener('click', () => {
      this.render();
    });
    bar.appendChild(btn);
    document.body.prepend(bar);
  }

  openSidePanel() {
    chrome.runtime.sendMessage({ action: 'openInSidePanel', url: this.url });
  }
}
