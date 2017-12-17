import { EditorState } from 'draft-js';

import { buildBlockMap } from './buildBlockMap';

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
  const blockMap = contentState.getBlockMap();

  const compareBlocks = (contentBlock: Draft.ContentBlock): boolean =>
    contentBlock === currentBlock;

  const blocksBefore = blockMap.toSeq().takeUntil(compareBlocks);
  const blocksAfter = blockMap
    .toSeq()
    .skipUntil(compareBlocks)
    .rest();

  const { newBlockMap, selectionKey, selectionOffset } = buildBlockMap(
    contentState,
    currentBlock,
    selection.getAnchorOffset(),
  );

  // Join back together with the current + new block
  const mergedBlockMap = blocksBefore
    .concat(newBlockMap.toSeq(), blocksAfter)
    .toOrderedMap();

  const modifiedContentState = <Draft.ContentState>contentState.merge({
    blockMap: mergedBlockMap,
    selectionBefore: selection,
    selectionAfter: selection.merge({
      anchorKey: selectionKey,
      anchorOffset: selectionOffset,
      focusKey: selectionKey,
      focusOffset: selectionOffset,
    }),
  });

  return EditorState.push(editorState, modifiedContentState, 'insert-fragment');
};
