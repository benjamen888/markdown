export class FileTree {
  constructor(container, onFileSelect) {
    this.container = container;
    this.onFileSelect = onFileSelect;
    this.container.innerHTML = '<h3>文件浏览</h3><div class="tree-content"><p style="color:var(--text-secondary);font-size:13px;">点击上方 📂 打开文件夹</p></div>';
  }

  async openDirectory() {
    try {
      const dirHandle = await window.showDirectoryPicker();
      this.container.innerHTML = '<h3>文件浏览</h3>';
      await this.renderTree(dirHandle, this.container, 0);
    } catch {}
  }

  async renderTree(dirHandle, parent, depth) {
    const entries = [];
    for await (const entry of dirHandle.values()) {
      entries.push(entry);
    }
    entries.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of entries) {
      const div = document.createElement('div');
      div.className = 'file-item';
      div.style.paddingLeft = `${8 + depth * 16}px`;

      if (entry.kind === 'directory') {
        div.textContent = `📂 ${entry.name}`;
        div.addEventListener('click', async () => {
          const sub = div.nextElementSibling;
          if (sub && sub.classList.contains('tree-children')) {
            sub.remove();
          } else {
            const childContainer = document.createElement('div');
            childContainer.className = 'tree-children';
            div.after(childContainer);
            await this.renderTree(entry, childContainer, depth + 1);
          }
        });
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.markdown')) {
        div.textContent = `📄 ${entry.name}`;
        div.addEventListener('click', () => {
          this.onFileSelect({ name: entry.name, handle: entry });
        });
      } else {
        continue;
      }

      parent.appendChild(div);
    }
  }
}
