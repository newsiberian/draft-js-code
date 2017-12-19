import { EditorState, ContentState, ContentBlock } from 'draft-js';

import deleteBlocks from '../utils/deleteBlocks';
import { createSelection, insertIndentsBeforeText, toPlainText } from './utils';

const firstText = 'function () {';
const firstBlock = new ContentBlock({
  key: 'a1',
  text: firstText,
  type: 'code-block',
});
const secondText = insertIndentsBeforeText(1, "const x = 'hello';");
const secondBlock = new ContentBlock({
  key: 'a2',
  text: secondText,
  type: 'code-block',
});
const thirdText = insertIndentsBeforeText(3, 'const str = `this is test`;');
const thirdBlock = new ContentBlock({
  key: 'a3',
  text: thirdText,
  type: 'code-block',
});
const currentContent = ContentState.createFromBlockArray([
  firstBlock,
  secondBlock,
  thirdBlock,
]);

it('should remove block with collapsed selection with moving next block to the position of current', () => {
  const offset = Math.floor(secondText.length / 2);
  const secondBlockSelection = createSelection(currentContent)
    .set('anchorKey', 'a2')
    .set('anchorOffset', offset)
    .set('focusKey', 'a2')
    .set('focusOffset', offset);

  const editorState = EditorState.create({
    currentContent,
    selection: secondBlockSelection,
  });

  const result = deleteBlocks(editorState);

  expect(toPlainText(result)).toEqual(`${firstText}\n${thirdText}`);
});

it('should save caret (focusOffset) position after deletion', () => {
  const offset = Math.floor(secondText.length / 2);
  const secondBlockSelection = createSelection(currentContent)
    .set('anchorKey', 'a2')
    .set('anchorOffset', offset)
    .set('focusKey', 'a2')
    .set('focusOffset', offset);

  const editorState = EditorState.create({
    currentContent,
    selection: secondBlockSelection,
  });

  const result = deleteBlocks(editorState);
  const newSelection = result.getSelection();

  expect(newSelection.getAnchorOffset()).toBe(offset);
  expect(newSelection.getFocusOffset()).toBe(offset);
});

it('should remove several blocks', () => {
  const offset = Math.floor(secondText.length / 2);
  const secondBlockSelection = createSelection(currentContent)
    .set('anchorKey', 'a1')
    .set('anchorOffset', offset)
    .set('focusKey', 'a2')
    .set('focusOffset', offset);

  const editorState = EditorState.create({
    currentContent,
    selection: secondBlockSelection,
  });

  const result = deleteBlocks(editorState);

  expect(toPlainText(result)).toEqual(thirdText);
});
