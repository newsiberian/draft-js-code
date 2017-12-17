export interface CharSpecs {
  name: string;
  pair: string;
  closed?: string;
}

export const blockChars = new Map<string, CharSpecs>([
  ['(', { name: 'LEFT PARENTHESIS', pair: '()', closed: ')' }],
  ['{', { name: 'LEFT CURLY BRACKET', pair: '{}', closed: '}' }],
  ['[', { name: 'LEFT SQUARE BRACKET', pair: '[]', closed: ']' }],
]);

export const specialChars = new Map<string, CharSpecs>([
  ['`', { name: 'GRAVE ACCENT', pair: '``' }],
  ["'", { name: 'APOSTROPHE', pair: "''" }],
  ['"', { name: 'QUOTATION MARK', pair: '""' }],
]);

blockChars.forEach((value, key) => {
  specialChars.set(key, value);
});

export const blockClosingChars = [')', '}', ']'];
