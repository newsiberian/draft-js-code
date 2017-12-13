import { EditorState, Modifier } from 'draft-js';

import { CharSpecs } from './specialChars';
import { detectNextCharacter, getCursorPosition } from './detectNextCharacter';

/**
 * Insert pair after special character if context allows that
 * @param {CharSpecs} charStats
 * @param {Draft.Model.ImmutableData.EditorState} editorState
 * @return {Draft.Model.ImmutableData.EditorState | void}
 */
export const insertClosingChar = (
  charStats: CharSpecs,
  editorState: Draft.EditorState,
): Draft.EditorState | void => {
  const contentState = editorState.getCurrentContent();
  const selection = editorState.getSelection();

  // if next char exists, then we should skip inserting the pair
  if (detectNextCharacter(contentState, selection)) {
    return;
  }

  const modifiedContent = Modifier.replaceText(
    contentState,
    selection,
    charStats.pair,
  );
  const modifiedState = EditorState.push(
    editorState,
    modifiedContent,
    'insert-characters',
  );

  // move cursor to the middle of the pair
  const cursorAfter = getCursorPosition(selection);
  const contentWithMovedCursor = <Draft.ContentState>modifiedContent.merge({
    selectionAfter: selection.merge({
      anchorKey: cursorAfter.key,
      anchorOffset: cursorAfter.offset + 1,
      focusKey: cursorAfter.key,
      focusOffset: cursorAfter.offset + 1,
    }),
  });

  return EditorState.forceSelection(
    modifiedState,
    contentWithMovedCursor.getSelectionAfter(),
  );
};
