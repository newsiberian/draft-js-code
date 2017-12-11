// import * as detectIndent from 'detect-indent';

/**
 * Detect indentation based on previous line (context)
 * @param {Draft.Model.ImmutableData.ContentBlock} previousBlock
 * @param {string} text
 * @return {string}
 */
export const detectIndentation = (
  // previousBlock: Draft.ContentBlock,
  text: string,
): string => {
  // const result = detectIndent(text);
  // return result.indent || DEFAULT_INDENTATION;
  return '  ';
};
