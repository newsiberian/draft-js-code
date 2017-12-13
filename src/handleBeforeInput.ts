import * as Draft from 'draft-js';

import { specialChars } from './utils/specialChars';
import { insertClosingChar } from './utils/insertClosingChar';

/**
 * Processing special characters `,',", (, {, [, by adding their pair
 * @param {string} char
 * @param {Draft.Model.ImmutableData.EditorState} editorState
 * @return {Draft.Model.ImmutableData.EditorState | void}
 */
export const handleBeforeInput = (
  char: string,
  editorState: Draft.EditorState,
): Draft.EditorState | void => {
  if (specialChars.has(char)) {
    return insertClosingChar(specialChars.get(char), editorState);
  }
};
