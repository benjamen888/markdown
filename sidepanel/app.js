import { Editor } from './editor/Editor.js';
import { Preview } from './preview/Preview.js';
import { FileOps } from './file-manager/FileOps.js';
import { FileTree } from './file-manager/FileTree.js';
import { RecentFiles } from './file-manager/RecentFiles.js';
import { setupShortcuts } from './editor/shortcuts.js';
import { setupScrollSync } from './preview/scroll-sync.js';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

class App {
  constructor() {
    this.currentMode = 'split';
    this.currentFile = null; // { name, handle, source: 'local' | 'url' | 'new' }

    // 初始化组件
    this.editor = new Editor(document.getElementById('editor'), (text) => {
      this.preview.render(text);
      this.updateStatus();
    });
    this.preview = new Preview(document.getElementById('preview'));
    this.fileOps = new FileOps();
    this.fileTree = new FileTree(document.getElementById('file-tree'), (file) => this.openFile(file));
    this.recentFiles = new RecentFiles(document.getElementById('recent-files'), (file) => this.openRecentFile(file));

    // 设置快捷键
    setupShortcuts(this.editor, () => this.saveFile());

    // 设置同步滚动
    setupScrollSync(
      document.getElementById('editor-pane'),
      document.getElementById('preview-pane')
    );

    // 绑定 UI 事件
    this.bindEvents();

    // 加载主题
    this.loadTheme();

    // 设置侧边栏
    this.setupSidePanel();

    // 设置默认内容
    this.editor.setContent('# Hello Markdown\n\n开始编辑吧！\n');
    this.preview.render(this.editor.getContent());
  }

  bindEvents() {
    // 模式切换
    document.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', () => this.switchMode(tab.dataset.mode));
    });

    // 工具栏按钮
    document.getElementById('btn-open').addEventListener('click', () => this.openLocalFile());
    document.getElementById('btn-open-folder').addEventListener('click', () => this.openFolder());
    document.getElementById('btn-open-url').addEventListener('click', () => this.openUrlDialog());
    document.getElementById('btn-new').addEventListener('click', () => this.newFile());
    document.getElementById('btn-save').addEventListener('click', () => this.saveFile());
    document.getElementById('btn-download').addEventListener('click', () => this.downloadFile());
    document.getElementById('btn-theme').addEventListener('click', () => this.toggleTheme());

    // 导出按钮
    document.getElementById('btn-export-png').addEventListener('click', () => this.exportToPng());
    document.getElementById('btn-export-pdf').addEventListener('click', () => this.exportToPdf());

    // URL 对话框
    document.getElementById('url-cancel').addEventListener('click', () => {
      document.getElementById('url-dialog').close();
    });
    document.getElementById('url-dialog').querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.openUrl(document.getElementById('url-input').value);
      document.getElementById('url-dialog').close();
    });
  }

  switchMode(mode) {
    this.currentMode = mode;
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

    const editorPane = document.getElementById('editor-pane');
    const previewPane = document.getElementById('preview-pane');
    const filesPane = document.getElementById('files-pane');

    editorPane.style.display = 'none';
    previewPane.style.display = 'none';
    filesPane.style.display = 'none';

    switch (mode) {
      case 'split':
        editorPane.style.display = 'block';
        previewPane.style.display = 'flex';
        editorPane.style.flex = '1';
        previewPane.style.flex = '1';
        break;
      case 'edit':
        editorPane.style.display = 'block';
        editorPane.style.flex = '1';
        break;
      case 'preview':
        previewPane.style.display = 'flex';
        previewPane.style.flex = '1';
        break;
      case 'files':
        filesPane.style.display = 'block';
        break;
    }
  }

  async openLocalFile() {
    const file = await this.fileOps.openFile();
    if (file) {
      this.currentFile = { name: file.name, handle: file.handle, source: 'local' };
      this.editor.setContent(file.content);
      this.preview.render(file.content);
      this.recentFiles.add(file.name, file.handle);
      this.updateStatus();
    }
  }

  async openFolder() {
    await this.fileTree.openDirectory();
  }

  openUrlDialog() {
    document.getElementById('url-dialog').showModal();
  }

  async openUrl(url) {
    if (!url) return;
    const content = await this.fileOps.fetchUrl(url);
    if (content !== null) {
      const name = url.split('/').pop() || 'remote.md';
      this.currentFile = { name, url, source: 'url' };
      this.editor.setContent(content);
      this.preview.render(content);
      this.updateStatus();
    }
  }

  async openFile(fileData) {
    if (fileData.handle) {
      const content = await this.fileOps.readFile(fileData.handle);
      this.currentFile = { name: fileData.name, handle: fileData.handle, source: 'local' };
      this.editor.setContent(content);
      this.preview.render(content);
      this.recentFiles.add(fileData.name, fileData.handle);
      this.updateStatus();
    }
  }

  async openRecentFile(fileData) {
    await this.openFile(fileData);
  }

  newFile() {
    this.currentFile = { name: 'untitled.md', source: 'new' };
    this.editor.setContent('');
    this.preview.render('');
    this.updateStatus();
  }

  async saveFile() {
    if (!this.currentFile) return;
    const content = this.editor.getContent();

    if (this.currentFile.source === 'local' && this.currentFile.handle) {
      await this.fileOps.writeFile(this.currentFile.handle, content);
    } else {
      this.downloadFile();
    }
  }

  downloadFile() {
    const content = this.editor.getContent();
    const name = this.currentFile?.name || 'untitled.md';
    this.fileOps.download(content, name);
  }

  updateStatus() {
    const name = this.currentFile?.name || '未打开文件';
    const lines = this.editor.getLineCount();
    const chars = this.editor.getContent().length;
    document.getElementById('status-filename').textContent = name;
    document.getElementById('status-info').textContent = `UTF-8 | ${lines} 行 | ${chars} 字`;
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    chrome.storage.local.set({ theme: next });
  }

  loadTheme() {
    chrome.storage.local.get('theme', (data) => {
      if (data.theme) {
        document.documentElement.setAttribute('data-theme', data.theme);
      }
    });
  }

  setupSidePanel() {
    if (chrome.sidePanel) {
      chrome.sidePanel.setOptions({ path: 'sidepanel/index.html' });
    }
  }

  async exportToPng() {
    const preview = document.getElementById('preview');
    if (!preview.innerHTML.trim()) {
      alert('预览内容为空，无法导出');
      return;
    }

    const btn = document.getElementById('btn-export-png');
    btn.disabled = true;
    btn.textContent = '导出中...';

    try {
      const canvas = await html2canvas(preview, {
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#ffffff',
        scale: 2,
        useCORS: true,
      });

      const link = document.createElement('a');
      const fileName = (this.currentFile?.name || 'untitled').replace(/\.md$/, '');
      link.download = `${fileName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('导出 PNG 失败:', err);
      alert('导出 PNG 失败: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '📷 PNG';
    }
  }

  async exportToPdf() {
    const preview = document.getElementById('preview');
    if (!preview.innerHTML.trim()) {
      alert('预览内容为空，无法导出');
      return;
    }

    const btn = document.getElementById('btn-export-pdf');
    btn.disabled = true;
    btn.textContent = '导出中...';

    try {
      const canvas = await html2canvas(preview, {
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#ffffff',
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // A4 页面尺寸 (mm)
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

      // 第一页
      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
      heightLeft -= (pdfHeight - margin * 2);

      // 如果内容超过一页，添加更多页
      while (heightLeft > 0) {
        position = -(pdfHeight - margin * 2) + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
        heightLeft -= (pdfHeight - margin * 2);
      }

      const fileName = (this.currentFile?.name || 'untitled').replace(/\.md$/, '');
      pdf.save(`${fileName}.pdf`);
    } catch (err) {
      console.error('导出 PDF 失败:', err);
      alert('导出 PDF 失败: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '📄 PDF';
    }
  }
}

// 启动应用
new App();
