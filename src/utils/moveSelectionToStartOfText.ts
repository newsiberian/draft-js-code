import { EditorState } from 'draft-js';
import detectIndent from 'detect-indent';

/**
 * Moves selection to the text beginning position or if the selection already
 * there then move it to the line start
 * @param {Draft.Model.ImmutableData.EditorState} editorState
 * @return {Draft.Model.ImmutableData.EditorState}
 */
export default (
  // export default for easier mocking
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

  // in draft-js 0.10.4 we could faced with bug. If you start typing from the
  // first line w/o indent and at the end of you text (in this first line) try
  // to execute this code (force change selection to offset: 0) the caret will
  // stay at the same place as before, but selection will show you offsets = 0.
  // If you press 'inserting new line' then it will move text from the line
  // beginning

  return EditorState.set(editorState, {
    selection: selection.merge({
      anchorKey: startKey,
      anchorOffset: newSelectionPosition,
      focusKey: startKey,
      focusOffset: newSelectionPosition,
      isBackward: false,
    }),
    forceSelection: true,
  });
};
