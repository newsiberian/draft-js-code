import * as Draft from 'draft-js';
import * as Immutable from 'immutable';

const compareBlocks = (
  contentBlock: Draft.ContentBlock,
  comparedBlock: Draft.ContentBlock,
): boolean => contentBlock === comparedBlock;

export const mergeBlockMap = (
  contentState: Draft.ContentState,
  block: Draft.ContentBlock,
  newBlockMap: Immutable.OrderedMap<string, Draft.ContentBlock>,
): Immutable.OrderedMap<string, Draft.ContentBlock> => {
  const blockMap = contentState.getBlockMap();
  const blocksBefore = blockMap.toSeq().takeUntil(b => compareBlocks(b, block));
  const blocksAfter = blockMap
    .toSeq()
    .skipUntil(b => compareBlocks(b, block))
    .rest();

  return blocksBefore.concat(newBlockMap.toSeq(), blocksAfter).toOrderedMap();
};
