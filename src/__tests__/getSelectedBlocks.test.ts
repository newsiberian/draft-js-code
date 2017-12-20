import {
  EditorState,
  ContentBlock,
  ContentState,
  SelectionState,
} from 'draft-js';

import { getSelectedBlocks } from '../utils/getSelectedBlocks';
import {
  toPlainText,
  createWithText,
  createSelection,
  initialText,
  indentLength,
  insertIndentsBeforeText,
} from './utils';

const firstText = 'function () {';
const firstBlock = new ContentBlock({
  key: 'a1',
  text: firstText,
  type: 'code-block',
});
const secondText = "const x = 'hello';";
const secondBlock = new ContentBlock({
  key: 'a2',
  text: insertIndentsBeforeText(1, secondText),
  type: 'code-block',
});
const testedText = 'const str = `this is test`;';
const thirdBlock = new ContentBlock({
  key: 'a3',
  text: insertIndentsBeforeText(3, testedText),
  type: 'code-block',
});
const currentContent = ContentState.createFromBlockArray([
  firstBlock,
  secondBlock,
  thirdBlock,
]);

it('should returned exactly the same blocks as selected', () => {
  const blockMap = getSelectedBlocks(currentContent, 'a2', 'a3');
  expect(blockMap.first().getKey()).toBe('a2');
  expect(blockMap.last().getKey()).toBe('a3');

  const blockMap2 = getSelectedBlocks(currentContent, 'a1', 'a2');
  expect(blockMap2.first().getKey()).toBe('a1');
  expect(blockMap2.last().getKey()).toBe('a2');

  const blockMap3 = getSelectedBlocks(currentContent, 'a1', 'a1');
  expect(blockMap3.size).toBe(1);
  expect(blockMap3.first().getKey()).toBe('a1');
  expect(blockMap3.last().getKey()).toBe('a1');
});
