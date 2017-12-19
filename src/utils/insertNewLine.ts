import { EditorState } from 'draft-js';

import { buildBlockMap } from './buildBlockMap';
import { mergeBlockMap } from './mergeBlockMap';

/**
 *  Insert a new line with right indent
 *
 * @param {Draft.EditorState} editorState
 * @return {Draft.EditorState}
 */
export const insertNewLine = (editorState: EditorState): EditorState => {
  const contentState = editorState.getCurrentContent();
  const selection = editorState.getSelection();
  const startKey = selection.getStartKey();
  const currentBlock = contentState.getBlockForKey(startKey);

  const { newBlockMap, selectionKey, selectionOffset } = buildBlockMap(
    contentState,
    currentBlock,
    selection.getAnchorOffset(),
  );

  const mergedBlockMap = mergeBlockMap(contentState, currentBlock, newBlockMap);

  const modifiedContent = <Draft.ContentState>contentState.merge({
    blockMap: mergedBlockMap,
    selectionBefore: selection,
    selectionAfter: selection.merge({
      anchorKey: selectionKey,
      anchorOffset: selectionOffset,
      focusKey: selectionKey,
      focusOffset: selectionOffset,
    }),
  });

  return EditorState.push(editorState, modifiedContent, 'insert-fragment');
};
