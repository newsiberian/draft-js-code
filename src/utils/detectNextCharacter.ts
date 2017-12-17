import * as Draft from 'draft-js';

import { blockClosingChars } from './specialChars';

export interface CursorPositionInterface {
  key: string;
  offset: number;
}

/**
 * Detect if there is any character exist after special character
 * @param {Draft.Model.ImmutableData.ContentState} contentState
 * @param {Draft.Model.ImmutableData.SelectionState} selection
 * @return {boolean}
 */
export const detectNextCharacter = (
  contentState: Draft.ContentState,
  selection: Draft.SelectionState,
): boolean => {
  const cursorPosition = getCursorPosition(selection);
  const blockWithCursor = contentState.getBlockForKey(cursorPosition.key);
  const nextChar = blockWithCursor.getText().substr(cursorPosition.offset, 1);

  // return true if next character is space-like or one of the block-closing ],},)
  return (
    Boolean(nextChar.length) &&
    !(
      blockClosingChars.indexOf(nextChar) !== -1 ||
      /\s|\t|\n|\f|\r|\v/.test(nextChar)
    )
  );
};

export const getCursorPosition = (
  selection: Draft.SelectionState,
): CursorPositionInterface => {
  return selection.getIsBackward()
    ? { key: selection.getAnchorKey(), offset: selection.getAnchorOffset() }
    : { key: selection.getFocusKey(), offset: selection.getFocusOffset() };
};
