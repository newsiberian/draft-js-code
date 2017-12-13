// import * as detectIndent from 'detect-indent';
import * as Draft from 'draft-js';

/**
 * Detect indentation based on previous line (context)
 * @param {Draft.Model.ImmutableData.ContentBlock} previousBlock
 * @param {string} text
 * @return {string}
 */
export const detectIndentation = (
  text?: string,
  previousBlock?: Draft.ContentBlock,
): string => {
  // const result = detectIndent(text);
  // return result.indent || DEFAULT_INDENTATION;
  return '  ';
};
