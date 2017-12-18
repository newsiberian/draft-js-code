import { ContentState } from 'draft-js';

import { detectIndentation } from '../utils/detectIndentation';
import { indentLength, insertIndentsBeforeText } from './utils';

it('should return indent based on previous block indent', () => {
  const MULTIPLIER = 2;
  const textWithIndent = insertIndentsBeforeText(MULTIPLIER);
  const currentContent = ContentState.createFromText(textWithIndent);
  const currentBlock = currentContent.getBlockMap().last();

  const result = detectIndentation(currentBlock);
  expect(result.length).toBe(indentLength * MULTIPLIER);
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
