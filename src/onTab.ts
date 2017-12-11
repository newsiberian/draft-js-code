import { EditorState, Modifier } from 'draft-js';

import * as React from 'react';

import { getIndentation } from './utils/getIndentation';
import { removeIndent } from './utils/removeIndent';

type SyntheticKeyboardEvent = React.KeyboardEvent<{}>;

// TODO: tab should complete indentation instead of just inserting one

/**
 * Handle pressing tab in the editor
 */
export const onTab = (
  e: SyntheticKeyboardEvent,
  editorState: Draft.EditorState,
): Draft.EditorState => {
  e.preventDefault();

  if (e.shiftKey) {
    return removeIndent(editorState, true);
  }

  const contentState = editorState.getCurrentContent();
  const selection = editorState.getSelection();
  const startKey = selection.getStartKey();
  const currentBlock = contentState.getBlockForKey(startKey);

  const indentation = getIndentation(currentBlock.getText());
  const newContentState = selection.isCollapsed()
    ? Modifier.insertText(contentState, selection, indentation)
    : Modifier.replaceText(contentState, selection, indentation);

  return EditorState.push(editorState, newContentState, 'insert-characters');
};
