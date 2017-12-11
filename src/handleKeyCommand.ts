import { removeIndent } from './utils/removeIndent';

import * as Draft from 'draft-js';

/**
 * Handle key command for code blocks
 *
 * @param {Draft.EditorState} editorState
 * @param {String} command
 * @return {Boolean}
 */
export const handleKeyCommand = (
  editorState: Draft.EditorState,
  command: Draft.DraftEditorCommand,
): any => {
  if (command === 'backspace') {
    return removeIndent(editorState, false);
  }
};
