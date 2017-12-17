import detectIndent from 'detect-indent';
import * as Draft from 'draft-js';

import { getIndentation } from './getIndentation';
import { blockChars } from './specialChars';

/**
 * Detect indentation based on previous line (context)
 * @param {Draft.Model.ImmutableData.ContentBlock} previousBlock
 * @return {string}
 */
export const detectIndentation = (
  previousBlock?: Draft.ContentBlock,
): string => {
  // instanceof not always working correctly here
  if (
    typeof previousBlock !== 'undefined' &&
    typeof previousBlock.getText === 'function'
  ) {
    const prevBlockText = previousBlock.getText();
    const prevTextIndent = detectIndent(prevBlockText).indent;

    // if previous text ends with special character, we increase the depth for next
    // block
    if (blockChars.has(prevBlockText.charAt(prevBlockText.length - 1))) {
      return prevTextIndent + numbersToSpaces(getIndentation());
    }

    return prevTextIndent;
  }

  return numbersToSpaces(getIndentation());
};

const numbersToSpaces = (indent: number): string => buildLine(' ', indent, 1);

const buildLine = (
  spaces: string,
  indent: number,
  currentIndent: number,
): string => {
  return currentIndent < indent ? ` ${spaces}` : spaces;
};
