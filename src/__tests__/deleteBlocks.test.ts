import { EditorState } from 'draft-js';

import deleteBlocks from '../utils/deleteBlocks';
import {
  contentWithThreeBlocks,
  createSelection,
  toPlainText,
  firstText,
  secondText,
  thirdText,
} from './utils';

it('should remove block with collapsed selection with moving next block to the position of current', () => {
  const offset = Math.floor(secondText.length / 2);
  const secondBlockSelection = createSelection(contentWithThreeBlocks)
    .set('anchorKey', 'a2')
    .set('anchorOffset', offset)
    .set('focusKey', 'a2')
    .set('focusOffset', offset);

  const editorState = EditorState.create({
    currentContent: contentWithThreeBlocks,
    selection: secondBlockSelection,
  });

  const result = deleteBlocks(editorState);

  expect(toPlainText(result)).toEqual(`${firstText}\n${thirdText}`);
});

it('should save caret (focusOffset) position after deletion', () => {
  const offset = Math.floor(secondText.length / 2);
  const secondBlockSelection = createSelection(contentWithThreeBlocks)
    .set('anchorKey', 'a2')
    .set('anchorOffset', offset)
    .set('focusKey', 'a2')
    .set('focusOffset', offset);

  const editorState = EditorState.create({
    currentContent: contentWithThreeBlocks,
    selection: secondBlockSelection,
  });

  const result = deleteBlocks(editorState);
  const newSelection = result.getSelection();

  expect(newSelection.getAnchorOffset()).toBe(offset);
  expect(newSelection.getFocusOffset()).toBe(offset);
});

it('should remove several blocks', () => {
  const offset = Math.floor(secondText.length / 2);
  const secondBlockSelection = createSelection(contentWithThreeBlocks)
    .set('anchorKey', 'a1')
    .set('anchorOffset', offset)
    .set('focusKey', 'a2')
    .set('focusOffset', offset);

  const editorState = EditorState.create({
    currentContent: contentWithThreeBlocks,
    selection: secondBlockSelection,
  });

  const result = deleteBlocks(editorState);

  expect(toPlainText(result)).toEqual(thirdText);
});
