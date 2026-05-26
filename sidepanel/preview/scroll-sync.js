export function setupScrollSync(editorPane, previewPane) {
  const editorScroller = editorPane.querySelector('.cm-scroller');
  if (!editorScroller) return;

  let syncing = false;
  editorScroller.addEventListener('scroll', () => {
    if (syncing) return;
    syncing = true;
    const ratio = editorScroller.scrollTop / (editorScroller.scrollHeight - editorScroller.clientHeight);
    previewPane.scrollTop = ratio * (previewPane.scrollHeight - previewPane.clientHeight);
    requestAnimationFrame(() => { syncing = false; });
  });
}
