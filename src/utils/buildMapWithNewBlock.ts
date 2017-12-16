import { BlockMapBuilder, ContentBlock, genKey } from 'draft-js';

import * as Draft from 'draft-js';
import * as Immutable from 'immutable';

import { detectIndentation } from './detectIndentation';
import { genCharacterList } from './genCharacterList';

/**
 * Creates new ContentBlock and merge it with current block into blockMap
 * @param {Draft.Model.ImmutableData.ContentState} contentState
 * @param {Draft.Model.ImmutableData.ContentBlock} currentBlock
 * @return {Immutable.OrderedMap<string, Draft.Model.ImmutableData.ContentBlock>}
 */
export const buildMapWithNewBlock = (
  contentState: Draft.ContentState,
  currentBlock: ContentBlock,
): Immutable.OrderedMap<string, ContentBlock> => {
  const indent = detectIndentation(currentBlock);
  const newBlock = createNewBlock(currentBlock, indent);
  return BlockMapBuilder.createFromArray([currentBlock, newBlock]);
};

const createNewBlock = (donor: ContentBlock, indent: string): ContentBlock => {
  return new ContentBlock({
    characterList: genCharacterList(indent),
    data: donor.getData(),
    depth: donor.getDepth(),
    key: genKey(),
    text: indent,
    type: donor.getType(),
  });
};
