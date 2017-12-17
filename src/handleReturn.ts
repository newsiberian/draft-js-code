import * as React from 'react';
import * as Draft from 'draft-js';

import { insertNewLine } from './utils/insertNewLine';
import { removeSelectedText } from './utils/removeSelectedText';

type SyntheticKeyboardEvent = React.KeyboardEvent<{}>;

/**
 *  We split code blocks only if user pressed Cmd+Enter
 *
 * @param {SyntheticKeyboardEvent} e
 * @param {Draft.EditorState} editorState
 * @return {Draft.EditorState}
 */
export const handleReturn = (
  e: SyntheticKeyboardEvent,
  editorState: Draft.EditorState,
): Draft.EditorState => {
  return editorState.getSelection().isCollapsed()
    ? insertNewLine(editorState)
    : removeSelectedText(editorState);
};
