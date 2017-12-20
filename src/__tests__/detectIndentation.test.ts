import { ContentState } from 'draft-js';

import { detectIndentation } from '../utils/detectIndentation';
import { indentLength, initialText, insertIndentsBeforeText } from './utils';

jest.mock('../utils/getIndentation', () => {
  return jest.fn(() => 2);
});

import getIndentation from '../utils/getIndentation';

beforeEach(() => {
  // reset before each
  getIndentation.mockImplementation(() => 2);
});

afterAll(() => {
  jest.unmock('../utils/getIndentation');
});

it('should return indent based on previous block indent', () => {
  const MULTIPLIER = 2;
  const textWithIndent = insertIndentsBeforeText(MULTIPLIER);
  const currentContent = ContentState.createFromText(textWithIndent);
  const currentBlock = currentContent.getBlockMap().last();

  const result = detectIndentation(currentBlock);
  expect(result.length).toBe(indentLength * MULTIPLIER);
});

it('should return indent when block char are at the end of current block', () => {
  const textWithOneSpace = `{`;
  const currentContent = ContentState.createFromText(textWithOneSpace);
  const currentBlock = currentContent.getBlockMap().last();

  getIndentation.mockImplementation(() => 1);

  const result = detectIndentation(currentBlock);
  expect(result.length).toBe(1);
});

it('should not allow accept something other than ContentBlock', () => {
  const result = detectIndentation({
    getText: () => {
      return '  some Text with indent;';
    },
  });

  // it should behave as if he had not been given an argument
  expect(result.length).toBe(indentLength);
});

it('should return default indent if no previous block was passed', () => {
  expect(detectIndentation().length).toBe(indentLength);
});
