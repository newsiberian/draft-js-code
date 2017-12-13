export interface CharSpecs {
  name: string;
  pair: string;
}

export const specialChars = new Map<string, CharSpecs>([
  ['`', { name: 'GRAVE ACCENT', pair: '``' }],
  ["'", { name: 'APOSTROPHE', pair: "''" }],
  ['"', { name: 'QUOTATION MARK', pair: '""' }],
  ['(', { name: 'LEFT PARENTHESIS', pair: '()' }],
  ['{', { name: 'LEFT CURLY BRACKET', pair: '{}' }],
  ['[', { name: 'LEFT SQUARE BRACKET', pair: '[]' }],
]);
