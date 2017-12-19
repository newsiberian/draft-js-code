import * as Draft from 'draft-js';

import moveSelectionToStartOfText from './utils/moveSelectionToStartOfText';
import deleteBlocks from './utils/deleteBlocks';
import { removeIndent } from './utils/removeIndent';

type DraftCodeEditorCommand =
  | Draft.DraftEditorCommand
  /**
   * Move selection to the text beginning position, or if it already there, to
   * start of the line
   */
  | 'selection-to-start-of-text'
  /**
   * Duplicate current block or selected blocks
   */
  | 'duplicate-blocks'
  /**
   * Delete line at caret or selected blocks
   */
  | 'delete-blocks';

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
    case 'selection-to-start-of-text':
      return moveSelectionToStartOfText(editorState);
    case 'duplicate-blocks':
      return null;
    case 'delete-blocks':
      return deleteBlocks(editorState);
    default:
      return undefined;
  }
};
