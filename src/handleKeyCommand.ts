import { removeIndent } from './utils/removeIndent';

import * as Draft from 'draft-js';

/**
 * Handle key command for code blocks
 * @param {Draft.Model.ImmutableData.EditorState} editorState
 * @param {Draft.Model.Constants.DraftEditorCommand} command
 * @return {Draft.Model.ImmutableData.EditorState | void}
 */
export const handleKeyCommand = (
  editorState: Draft.EditorState,
  command: Draft.DraftEditorCommand,
): Draft.EditorState | void => {
  if (command === 'backspace') {
    return removeIndent(editorState, false);
  }
};
