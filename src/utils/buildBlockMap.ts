import { BlockMapBuilder, ContentBlock, genKey } from 'draft-js';

import * as Draft from 'draft-js';
import * as Immutable from 'immutable';

import { detectIndentation } from './detectIndentation';
import { genCharacterList } from './genCharacterList';
import { blockChars } from './specialChars';

export interface NewBlockMapWithSelection {
  newBlockMap: Immutable.OrderedMap<string, ContentBlock>;
  selectionKey: string;
  selectionOffset: number;
}

/**
 * Creates new ContentBlock and merge it with current block into blockMap
 * @param {Draft.Model.ImmutableData.ContentState} contentState
 * @param {Draft.Model.ImmutableData.ContentBlock} currentBlock
 * @param {number} offset - cursor position
 * @return {Immutable.OrderedMap<string, Draft.Model.ImmutableData.ContentBlock>}
 */
export const buildBlockMap = (
  contentState: Draft.ContentState,
  currentBlock: ContentBlock,
  offset: number,
): NewBlockMapWithSelection => {
  const indent = detectIndentation(currentBlock);
  const text = currentBlock.getText();

  const charBefore = text.charAt(offset - 1);
  const charAfter = text.charAt(offset);

  const firstBlockText = text.substring(0, offset);
  const firstBlock = <ContentBlock>currentBlock
    .setIn(['text'], firstBlockText)
    .setIn(['characterList'], genCharacterList(firstBlockText));
  const lastBlock = createNewBlock(
    currentBlock,
    `${indent}${text.substring(offset)}`,
  );

  if (blockChars.has(charBefore)) {
    const blockChar = blockChars.get(charBefore);

    if (charAfter === blockChar.closed) {
      const middleBlock = createNewBlock(
        currentBlock,
        `${indent}${detectIndentation()}`,
      );

      return {
        newBlockMap: BlockMapBuilder.createFromArray([
          firstBlock,
          // block + 1 indent between block characters
          middleBlock,
          lastBlock,
        ]),
        selectionKey: middleBlock.getKey(),
        selectionOffset: middleBlock.getLength(),
      };
    }
  }

  return {
    newBlockMap: BlockMapBuilder.createFromArray([firstBlock, lastBlock]),
    selectionKey: lastBlock.getKey(),
    selectionOffset: lastBlock.getLength(),
  };
};

const createNewBlock = (donor: ContentBlock, text: string): ContentBlock => {
  return new ContentBlock({
    characterList: genCharacterList(text),
    data: donor.getData(),
    depth: donor.getDepth(),
    key: genKey(),
    text,
    type: donor.getType(),
  });
};
