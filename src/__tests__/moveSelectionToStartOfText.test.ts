import { EditorState, ContentState } from 'draft-js';
import detectIndent from 'detect-indent';

import { moveSelectionToStartOfText } from '../utils/moveSelectionToStartOfText';
import {
  createWithText,
  createSelection,
  initialText,
  indentLength,
  insertIndentsBeforeText,
} from './utils';

it('should move selection to the text beginning', () => {
  const firstContent = ContentState.createFromText(initialText);
  const firstSelection = createSelection(firstContent)
    .set('anchorOffset', initialText.length)
    .set('focusOffset', initialText.length);
  const firstState = EditorState.create({
    currentContent: firstContent,
    selection: firstSelection,
  });
  const firstResult = moveSelectionToStartOfText(firstState);
  const firstSelectionAfter = firstResult.getSelection();
  expect(firstSelectionAfter.getAnchorOffset()).toBe(
    detectIndent(initialText).amount,
  );
  expect(firstSelectionAfter.getFocusOffset()).toBe(
    detectIndent(initialText).amount,
  );

  const textWithIndent = insertIndentsBeforeText(1);
  const secondContent = ContentState.createFromText(textWithIndent);
  const secondSelection = createSelection(secondContent)
    .set('anchorOffset', textWithIndent.length)
    .set('focusOffset', textWithIndent.length);
  const secondState = EditorState.create({
    currentContent: secondContent,
    selection: secondSelection,
  });
  const secondResult = moveSelectionToStartOfText(secondState);
  const secondSelectionAfter = secondResult.getSelection();
  expect(secondSelectionAfter.getAnchorOffset()).toBe(
    detectIndent(textWithIndent).amount,
  );
  expect(secondSelectionAfter.getFocusOffset()).toBe(
    detectIndent(textWithIndent).amount,
  );
});

it('should move selection from the line start to text beginning', () => {
  const text = '   text beginning';
  // "   text beginning"
  //  ^ default selection here
  const firstEditorState = createWithText(text);
  const result = moveSelectionToStartOfText(firstEditorState);
  const after = result.getSelection();
  expect(after.getAnchorOffset()).toBe(detectIndent(text).amount);
  expect(after.getFocusOffset()).toBe(detectIndent(text).amount);
});

it('should move selection from text beginning to block start', () => {
  const textWithIndent = insertIndentsBeforeText(1);
  const currentContent = ContentState.createFromText(textWithIndent);
  const selection = createSelection(currentContent)
    .set('anchorOffset', indentLength)
    .set('focusOffset', indentLength);
  const state = EditorState.create({ currentContent, selection });
  const result = moveSelectionToStartOfText(state);
  const after = result.getSelection();

  expect(after.getAnchorOffset()).toBe(0);
  expect(after.getFocusOffset()).toBe(0);
});
