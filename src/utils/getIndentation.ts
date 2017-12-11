// import * as detectIndent from 'detect-indent';

const DEFAULT_INDENTATION = '  ';

/**
 * Detect indentation in a text
 * @param {String} text
 * @return {String}
 */
export const getIndentation = (text: string): string => {
  // const result = detectIndent(text);
  // return result.indent || DEFAULT_INDENTATION;
  return DEFAULT_INDENTATION;
};
