import * as Draft from 'draft-js';

import moveSelectionToStartOfText from './utils/moveSelectionToStartOfText';
import { removeIndent } from './utils/removeIndent';

type DraftCodeEditorCommand =
  | Draft.DraftEditorCommand
  | 'move-selection-to-start-of-text';

/**
 * Handle key command for code blocks
 * @param {Draft.Model.ImmutableData.EditorState} editorState
 * @param {Draft.Model.Constants.DraftEditorCommand} command
 * @return {Draft.Model.ImmutableData.EditorState | void}
 */
export const handleKeyCommand = (
  editorState: Draft.EditorState,
  command: DraftCodeEditorCommand,
): Draft.EditorState | void => {
  switch (command) {
    case 'backspace':
      // here undefined could be returned
      return removeIndent(editorState, false);
    case 'move-selection-to-start-of-text':
      return moveSelectionToStartOfText(editorState);
    default:
      return undefined;
  }
};
