import { EditorState } from 'draft-js';
import detectIndent from 'detect-indent';

/**
 * Moves selection to the text beginning position or if the selection already
 * there then move it to the line start
 * @param {Draft.Model.ImmutableData.EditorState} editorState
 * @return {Draft.Model.ImmutableData.EditorState}
 */
export const moveSelectionToStartOfText = (
  editorState: EditorState,
): EditorState => {
  const contentState = editorState.getCurrentContent();
  const selection = editorState.getSelection();
  const startKey = selection.getStartKey();
  const currentBlock = contentState.getBlockForKey(startKey);
  const blockText = currentBlock.getText();
  const currentIndent = detectIndent(blockText).amount;
  const newSelectionPosition =
    selection.getFocusOffset() === currentIndent ? 0 : currentIndent;

  return EditorState.set(editorState, {
    selection: selection.merge({
      anchorKey: currentBlock.getKey(),
      anchorOffset: newSelectionPosition,
      focusKey: currentBlock.getKey(),
      focusOffset: newSelectionPosition,
      isBackward: false,
    }),
    forceSelection: true,
  });
};
