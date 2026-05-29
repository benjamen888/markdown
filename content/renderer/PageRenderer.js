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
      () => this.openSidePanel(),
      (type) => this.handleExport(type)
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

  async handleExport(type) {
    const container = this.previewMode.element;
    if (!container.innerHTML.trim()) {
      alert('预览内容为空，无法导出');
      return;
    }

    const btn = type === 'png' ? this.toolbar.exportPngBtn : this.toolbar.exportPdfBtn;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '导出中...';

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });

      if (type === 'png') {
        const link = document.createElement('a');
        const fileName = this.url?.split('/').pop()?.replace(/\.md$/, '') || 'markdown';
        link.download = `${fileName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        const pdfWidth = 210;
        const pdfHeight = 297;
        const margin = 10;
        const contentWidth = pdfWidth - margin * 2;
        const contentHeight = (imgHeight * contentWidth) / imgWidth;

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        let heightLeft = contentHeight;
        let position = margin;

        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
        heightLeft -= (pdfHeight - margin * 2);

        while (heightLeft > 0) {
          position = -(pdfHeight - margin * 2) + margin;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
          heightLeft -= (pdfHeight - margin * 2);
        }

        const fileName = this.url?.split('/').pop()?.replace(/\.md$/, '') || 'markdown';
        pdf.save(`${fileName}.pdf`);
      }
    } catch (err) {
      console.error('导出失败:', err);
      alert('导出失败: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
}
