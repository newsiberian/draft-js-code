import { ContentBlock, genKey } from 'draft-js';

import { genCharacterList } from './genCharacterList';

/**
 * Creates new ContentBlock based on props of given block
 * @param {Draft.Model.ImmutableData.ContentBlock} donor
 * @param {string} text
 * @return {Draft.Model.ImmutableData.ContentBlock}
 */
export const createNewBlock = (
  donor: ContentBlock,
  text: string,
): ContentBlock => {
  return new ContentBlock({
    characterList: genCharacterList(text),
    data: donor.getData(),
    depth: donor.getDepth(),
    key: genKey(),
    text,
    type: donor.getType(),
  });
};
