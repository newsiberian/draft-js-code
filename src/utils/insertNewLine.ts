import { EditorState } from 'draft-js';

import { buildMapWithNewBlock } from './buildMapWithNewBlock';

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
  // const startOffset = selection.getStartOffset();
  const currentBlock = contentState.getBlockForKey(startKey);
  // const blockText = currentBlock.getText();

  // Detect newline separation
  // var newLine = getNewLine(blockText);

  // const currentBlockLengthBefore = currentBlock.getLength();

  // const modifiedCurrentBlock = currentBlock.setIn(['text'], `${blockText}    `);

  const blockMap = contentState.getBlockMap();
  const compareBlocks = contentBlock => contentBlock === currentBlock;
  const blocksBefore = blockMap.toSeq().takeUntil(compareBlocks);
  const blocksAfter = blockMap
    .toSeq()
    .skipUntil(compareBlocks)
    .rest();

  const blockMapWithNewBlock = buildMapWithNewBlock(contentState, currentBlock);
  const newContentBlock = blockMapWithNewBlock.last();

  // Join back together with the current + new block
  const newBlockMap = blocksBefore
    .concat(blockMapWithNewBlock.toSeq(), blocksAfter)
    .toOrderedMap();

  const modifiedContentState = <Draft.ContentState>contentState.merge({
    blockMap: newBlockMap,
    selectionBefore: selection,
    selectionAfter: selection.merge({
      anchorKey: newContentBlock.getKey(),
      anchorOffset: newContentBlock.getLength(),
      focusKey: newContentBlock.getKey(),
      focusOffset: newContentBlock.getLength(),
    }),
  });

  // const contentStateWithSplittedBlock = Modifier.splitBlock(contentState, selection.merge({
  //   anchorKey: currentBlock.getKey(),
  //   anchorOffset: currentBlock.getLength(),
  //   focusKey: currentBlock.getKey(),
  //   focusOffset: currentBlock.getLength(),
  // }));
  //
  //
  //
  // // select all current block to replace it
  // const targetRange = selection.merge({
  //   anchorKey: currentBlock.getKey(),
  //   anchorOffset: 0,
  //   focusKey: currentBlock.getKey(),
  //   focusOffset: currentBlock.getText().length,
  //   isBackward: false
  // });

  // Add or replace
  // if (selection.isCollapsed()) {
  //
  // } else {
  //
  // }

  return EditorState.push(editorState, modifiedContentState, 'insert-fragment');
};
