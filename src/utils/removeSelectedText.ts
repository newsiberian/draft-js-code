import { EditorState, Modifier } from 'draft-js';

/**
 * Removing selected text and then splitting block to move to the new line
 * @param {Draft.Model.ImmutableData.EditorState} editorState
 * @return {Draft.Model.ImmutableData.EditorState}
 */
export const removeSelectedText = (editorState: EditorState): EditorState => {
  const newState = EditorState.push(
    editorState,
    Modifier.removeRange(
      editorState.getCurrentContent(),
      editorState.getSelection(),
      editorState.getSelection().getIsBackward() ? 'backward' : 'forward',
    ),
    'remove-range',
  );

  return EditorState.push(
    editorState,
    Modifier.splitBlock(newState.getCurrentContent(), newState.getSelection()),
    'split-block',
  );
};
