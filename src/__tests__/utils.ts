import { EditorState, ContentState, SelectionState } from 'draft-js';

import { getIndentation } from '../utils/getIndentation';

export const toPlainText = (editorState: Draft.EditorState): string =>
  editorState.getCurrentContent().getPlainText();

export const createWithText = (text: string): Draft.EditorState => {
  const contentState = ContentState.createFromText(text);
  return EditorState.createWithContent(contentState);
};

export const createSelection = (
  currentContent: Draft.ContentState,
): Draft.SelectionState =>
  SelectionState.createEmpty(
    currentContent
      .getBlockMap()
      .first()
      .getKey(),
  );

export const initialText = "return 'hello'; // comment";

// get default indent here
export const indentLength = getIndentation();

// modify string with using default indent
export const insertIndentsBeforeText = (
  modifier: number,
  text: string = initialText,
): string => {
  const indentsLength = indentLength * modifier;
  let textWithIndents = `${text}`;
  for (let i = 0, l = indentsLength; i < l; i++) {
    textWithIndents = ` ${textWithIndents}`;
  }
  return textWithIndents;
};
