import { EditorState, Modifier } from 'draft-js';

export const deleteBlocks = (editorState: EditorState): EditorState => {
  const contentState = editorState.getCurrentContent();
  const selection = editorState.getSelection();
  // after blocks remove we should move caret to the previous position
  const initialFocusOffset = selection.getFocusOffset();
  const startKey = selection.getStartKey();
  const endKey = selection.getEndKey();
  const blockAfter = contentState.getBlockAfter(endKey);

  const modifiedContent = Modifier.removeRange(
    contentState,
    selection.merge({
      anchorKey: startKey,
      anchorOffset: 0,
      focusKey: blockAfter.getKey(),
      focusOffset: 0,
      isBackward: false,
    }),
  );

  const newState = EditorState.push(
    editorState,
    modifiedContent,
    'remove-range',
  );

  return EditorState.forceSelection(
    newState,
    selection.merge({
      anchorKey: endKey,
      anchorOffset: initialFocusOffset,
      focusKey: endKey,
      focusOffset: initialFocusOffset,
    }),
  );
};
