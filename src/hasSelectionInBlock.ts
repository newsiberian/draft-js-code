import * as Draft from 'draft-js';
/**
 * Return true if selection is inside a code block
 *
 * @param {Draft.EditorState} editorState
 * @return {Boolean}
 */
export const hasSelectionInBlock = (
  editorState: Draft.EditorState,
): boolean => {
  const selection = editorState.getSelection();
  const contentState = editorState.getCurrentContent();
  const startKey = selection.getStartKey();
  const currentBlock = contentState.getBlockForKey(startKey);

  return currentBlock.getType() === 'code-block';
};
