import { EditorState, ContentState, ContentBlock } from 'draft-js';

import { removeSelectedText } from '../utils/removeSelectedText';
import { createSelection, toPlainText } from './utils';

const ANCHOR_OFFSET = 5;
const FOCUS_OFFSET = 3;
const firstText = '1 2 3 4 5';
const firstBlock = new ContentBlock({
  key: 'a1',
  text: firstText,
  type: 'code-block',
});
const secondText = '6 7 8 9 0';
const secondBlock = new ContentBlock({
  key: 'a2',
  text: secondText,
  type: 'code-block',
});

it('should remove selected text', () => {
  const currentContent = ContentState.createFromBlockArray([
    firstBlock,
    secondBlock,
  ]);
  const selection = createSelection(currentContent)
    .set('anchorKey', 'a1')
    .set('anchorOffset', ANCHOR_OFFSET)
    .set('focusKey', 'a2')
    .set('focusOffset', FOCUS_OFFSET);
  // '1 2 3 4 5'
  //       ^ anchor here
  // '6 7 8 9 0'
  //     ^ offset here
  const editorState = EditorState.create({
    currentContent,
    selection,
  });

  const result = removeSelectedText(editorState);
  expect(toPlainText(result)).toEqual(
    `${firstText.substring(0, ANCHOR_OFFSET)}\n${secondText.substring(
      FOCUS_OFFSET,
    )}`,
  );

  const backwardSelection = createSelection(currentContent)
    .set('anchorKey', 'a2')
    .set('anchorOffset', ANCHOR_OFFSET)
    .set('focusKey', 'a1')
    .set('focusOffset', FOCUS_OFFSET)
    .set('isBackward', true);
  // '1 2 3 4 5'
  //     ^ offset here
  // '6 7 8 9 0'
  //       ^ anchor here
  const editorStateCaseTwo = EditorState.create({
    currentContent,
    selection: backwardSelection,
  });

  const secondResult = removeSelectedText(editorStateCaseTwo);
  expect(toPlainText(secondResult)).toEqual(
    `${firstText.substring(0, FOCUS_OFFSET)}\n${secondText.substring(
      ANCHOR_OFFSET,
    )}`,
  );
});

it('should move cursor to the selection end (right side of the selection)', () => {
  const currentContent = ContentState.createFromBlockArray([
    firstBlock,
    secondBlock,
  ]);
  const selection = createSelection(currentContent)
    .set('anchorKey', 'a1')
    .set('anchorOffset', ANCHOR_OFFSET)
    .set('focusKey', 'a2')
    .set('focusOffset', FOCUS_OFFSET);
  // '1 2 3 4 5'
  //       ^ anchor here
  // '6 7 8 9 0'
  //     ^ offset here
  const editorState = EditorState.create({
    currentContent,
    selection,
  });
  const newState = removeSelectedText(editorState);
  const endKey = newState.getSelection().getEndKey();
  // last block key will be changed after `split-block`, so it is should not be
  // equal to `a2`, `a1`
  expect(endKey).not.toEqual('a1');
  expect(endKey).not.toEqual('a2');
});
