import { ViewPlugin, Decoration, WidgetType } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

// 隐藏 markdown 标记的 decoration
class HeadingWidget extends WidgetType {
  constructor(level) { super(); this.level = level; }
  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-heading-mark';
    span.style.opacity = '0.3';
    return span;
  }
}

function headingDecorations(view) {
  const builder = new RangeSetBuilder();
  for (const { from, to } of view.visibleRanges) {
    const doc = view.state.doc;
    for (let line = doc.lineAt(from).number; line <= doc.lineAt(to).number; line++) {
      const lineObj = doc.line(line);
      const text = lineObj.text;
      const match = text.match(/^(#{1,6})\s/);
      if (match) {
        builder.add(
          lineObj.from,
          lineObj.from + match[1].length + 1,
          Decoration.replace({ widget: new HeadingWidget(match[1].length) })
        );
      }
    }
  }
  return builder.finish();
}

// 粗体标记隐藏
function boldDecorations(view) {
  const builder = new RangeSetBuilder();
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.sliceDoc(from, to);
    const regex = /\*\*(.+?)\*\*/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const start = from + match.index;
      builder.add(start, start + 2, Decoration.replace({}));
      builder.add(start + match[0].length - 2, start + match[0].length, Decoration.replace({}));
    }
  }
  return builder.finish();
}

// 斜体标记隐藏
function italicDecorations(view) {
  const builder = new RangeSetBuilder();
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.sliceDoc(from, to);
    const regex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const start = from + match.index;
      builder.add(start, start + 1, Decoration.replace({}));
      builder.add(start + match[0].length - 1, start + match[0].length, Decoration.replace({}));
    }
  }
  return builder.finish();
}

export const wysiwygExtension = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = this.buildDecorations(view);
    }
    update(update) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }
    buildDecorations(view) {
      return Decoration.set([
        ...headingDecorations(view),
        ...boldDecorations(view),
        ...italicDecorations(view),
      ]);
    }
  },
  { decorations: (v) => v.decorations }
);
