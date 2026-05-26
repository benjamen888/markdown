export class RecentFiles {
  constructor(container, onFileSelect) {
    this.container = container;
    this.onFileSelect = onFileSelect;
    this.load();
  }

  load() {
    chrome.storage.local.get('recentFiles', (data) => {
      this.files = data.recentFiles || [];
      this.render();
    });
  }

  add(name, handle) {
    this.files = this.files.filter((f) => f.name !== name);
    this.files.unshift({ name, timestamp: Date.now() });
    this.files = this.files.slice(0, 20);
    chrome.storage.local.set({ recentFiles: this.files });
    this.render();
  }

  render() {
    if (this.files.length === 0) {
      this.container.innerHTML = '<h3>最近文件</h3><p style="color:var(--text-secondary);font-size:13px;">暂无记录</p>';
      return;
    }
    this.container.innerHTML = '<h3>最近文件</h3>' +
      this.files.map((f) => `<div class="file-item">📄 ${f.name}</div>`).join('');
    this.container.querySelectorAll('.file-item').forEach((el, i) => {
      el.addEventListener('click', () => this.onFileSelect(this.files[i]));
    });
  }
}
