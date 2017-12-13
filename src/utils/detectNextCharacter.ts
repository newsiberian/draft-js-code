import * as Draft from 'draft-js';

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

  return Boolean(nextChar.length) && !/\s|\t|\n|\f|\r|\v/.test(nextChar);
};

export const getCursorPosition = (
  selection: Draft.SelectionState,
): CursorPositionInterface => {
  return selection.getIsBackward()
    ? { key: selection.getAnchorKey(), offset: selection.getAnchorOffset() }
    : { key: selection.getFocusKey(), offset: selection.getFocusOffset() };
};
