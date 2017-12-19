import { EditorState, Modifier } from 'draft-js';

/**
 * Removes selected blocks entirely with moving cursor to the same position
 * where focusOffset was to the next block after selection end
 * @param {Draft.Model.ImmutableData.EditorState} editorState
 * @return {Draft.Model.ImmutableData.EditorState}
 */
export default (editorState: EditorState): EditorState => {
  // exported as default for tests
  const contentState = editorState.getCurrentContent();
  const selection = editorState.getSelection();
  // after blocks remove we should move caret to the previous position
  const initialFocusOffset = selection.getFocusOffset();
  const startKey = selection.getStartKey();
  const endKey = selection.getEndKey();
  const blockAfter = contentState.getBlockAfter(endKey);

  const modifiedContent = Modifier.removeRange(
    contentState,
    <Draft.SelectionState>selection.merge({
      anchorKey: startKey,
      anchorOffset: 0,
      focusKey: blockAfter.getKey(),
      focusOffset: 0,
      isBackward: false,
    }),
    'forward',
  );

  const newState = EditorState.push(
    editorState,
    modifiedContent,
    'remove-range',
  );

  return EditorState.forceSelection(
    newState,
    <Draft.SelectionState>selection.merge({
      anchorKey: endKey,
      anchorOffset: initialFocusOffset,
      focusKey: endKey,
      focusOffset: initialFocusOffset,
    }),
  );
};
