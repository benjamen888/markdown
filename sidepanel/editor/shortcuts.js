export function setupShortcuts(editor, onSave) {
  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;

    // Ctrl+S — 保存
    if (mod && e.key === 's') {
      e.preventDefault();
      onSave();
      return;
    }

    // Ctrl+B — 粗体
    if (mod && e.key === 'b') {
      e.preventDefault();
      editor.wrapSelection('**', '**');
      return;
    }

    // Ctrl+I — 斜体
    if (mod && e.key === 'i' && !e.shiftKey) {
      e.preventDefault();
      editor.wrapSelection('*', '*');
      return;
    }

    // Ctrl+K — 链接
    if (mod && e.key === 'k') {
      e.preventDefault();
      const { from, to } = editor.view.state.selection.main;
      const selected = editor.view.state.sliceDoc(from, to);
      if (selected) {
        editor.insertText(`[${selected}](url)`);
      } else {
        editor.insertText('[链接文字](url)');
      }
      return;
    }

    // Ctrl+Shift+I — 图片
    if (mod && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      editor.insertText('![alt](url)');
      return;
    }

    // Ctrl+` — 行内代码
    if (mod && e.key === '`' && !e.shiftKey) {
      e.preventDefault();
      editor.wrapSelection('`', '`');
      return;
    }

    // Ctrl+Shift+` — 代码块
    if (mod && e.shiftKey && e.key === '`') {
      e.preventDefault();
      editor.insertText('\n```\n\n```\n');
      return;
    }
  });
}
