import { CharacterMetadata } from 'draft-js';
import { List } from 'immutable';

/**
 * @deprecated should be generated on ContentBlock creation after draft-js 0.10.4
 * Generate character list from given string
 * @param {string} line
 * @return {List<Draft.Model.ImmutableData.CharacterMetadata>}
 */
export const genCharacterList = (line: string): List<CharacterMetadata> => {
  return List(line.split('').map(() => CharacterMetadata.create()));
};
