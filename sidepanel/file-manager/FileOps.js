export class FileOps {
  async openFile() {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }],
      });
      const file = await handle.getFile();
      const content = await file.text();
      return { name: file.name, handle, content };
    } catch {
      return null;
    }
  }

  async readFile(handle) {
    const file = await handle.getFile();
    return file.text();
  }

  async writeFile(handle, content) {
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async fetchUrl(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (err) {
      alert(`加载失败: ${err.message}`);
      return null;
    }
  }

  download(content, filename) {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
