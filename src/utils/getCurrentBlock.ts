import * as Draft from 'draft-js';

/**
 * The helper that retrieves the current block from editorState
 * @param {Draft.Model.ImmutableData.EditorState} editorState
 * @return {Draft.Model.ImmutableData.ContentBlock}
 */
export const getCurrentBlock = (
  editorState: Draft.EditorState,
): Draft.ContentBlock => {
  const contentState = editorState.getCurrentContent();
  const selection = editorState.getSelection();
  const startKey = selection.getStartKey();

  return contentState.getBlockForKey(startKey);
};
