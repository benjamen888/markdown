export function setupScrollSync(editorPane, previewPane) {
  const editorScroller = editorPane.querySelector('.cm-scroller');
  if (!editorScroller) return;

  let syncing = false;

  editorScroller.addEventListener('scroll', () => {
    if (syncing) return;
    syncing = true;

    const editorScrollable = editorScroller.scrollHeight - editorScroller.clientHeight;
    if (editorScrollable <= 0) {
      syncing = false;
      return;
    }

    const ratio = editorScroller.scrollTop / editorScrollable;
    const previewScrollable = previewPane.scrollHeight - previewPane.clientHeight;
    previewPane.scrollTop = ratio * previewScrollable;

    requestAnimationFrame(() => { syncing = false; });
  });

  previewPane.addEventListener('scroll', () => {
    if (syncing) return;
    syncing = true;

    const previewScrollable = previewPane.scrollHeight - previewPane.clientHeight;
    if (previewScrollable <= 0) {
      syncing = false;
      return;
    }

    const ratio = previewPane.scrollTop / previewScrollable;
    const editorScrollable = editorScroller.scrollHeight - editorScroller.clientHeight;
    editorScroller.scrollTop = ratio * editorScrollable;

    requestAnimationFrame(() => { syncing = false; });
  });
}
