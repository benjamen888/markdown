import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import { wysiwygExtension } from './wysiwyg.js';

export class Editor {
  constructor(container, onChange) {
    this.onChange = onChange;
    this.view = new EditorView({
      state: EditorState.create({
        doc: '',
        extensions: this.getBaseExtensions(),
      }),
      parent: container,
    });
  }

  getBaseExtensions() {
    return [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      bracketMatching(),
      closeBrackets(),
      highlightSelectionMatches(),
      syntaxHighlighting(defaultHighlightStyle),
      markdown({ base: markdownLanguage }),
      autocompletion(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        ...closeBracketsKeymap,
        indentWithTab,
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          this.onChange(update.state.doc.toString());
        }
      }),
      EditorView.theme({
        '&': { height: '100%' },
        '.cm-scroller': { overflow: 'auto' },
      }),
    ];
  }

  setWysiwyg(enabled) {
    const content = this.getContent();
    const extensions = this.getBaseExtensions();
    if (enabled) {
      extensions.push(wysiwygExtension);
    }
    this.view.setState(EditorState.create({
      doc: content,
      extensions,
      selection: this.view.state.selection,
    }));
  }

  getContent() {
    return this.view.state.doc.toString();
  }

  setContent(text) {
    this.view.dispatch({
      changes: { from: 0, to: this.view.state.doc.length, insert: text },
    });
  }

  getCursorPos() {
    return this.view.state.selection.main.head;
  }

  getLineCount() {
    return this.view.state.doc.lines;
  }

  insertText(text) {
    const { from, to } = this.view.state.selection.main;
    this.view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length },
    });
    this.view.focus();
  }

  wrapSelection(before, after) {
    const { from, to } = this.view.state.selection.main;
    const selected = this.view.state.sliceDoc(from, to);
    const replacement = before + selected + after;
    this.view.dispatch({
      changes: { from, to, insert: replacement },
      selection: { anchor: from + before.length, head: from + before.length + selected.length },
    });
    this.view.focus();
  }

  destroy() {
    this.view.destroy();
  }
}
