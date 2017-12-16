import { EditorState, ContentState } from 'draft-js';

import { handleReturn } from '../handleReturn';
import {
  createSelection,
  insertIndentsBeforeText,
  initialText,
  toPlainText,
  createWithText,
} from './utils';

it('should insert a new line', () => {
  const before = createWithText(initialText);
  const after = handleReturn({}, before);

  expect(toPlainText(before)).toEqual(initialText);
  expect(toPlainText(after)).toEqual(initialText + '\n');
});

it('should insert a new line at the same level of indentation', () => {
  const textWithOneIndent = insertIndentsBeforeText(1);
  const currentContent = ContentState.createFromText(textWithOneIndent);
  const afterLastCharacter = createSelection(currentContent)
    .set('anchorOffset', initialText.length)
    .set('focusOffset', initialText.length);

  const before = EditorState.create({
    currentContent,
    // Jump selection to the end of the line
    selection: afterLastCharacter,
  });
  const after = handleReturn({}, before);

  expect(toPlainText(before)).toEqual(textWithOneIndent);
  expect(toPlainText(after)).toEqual(
    textWithOneIndent + '\n' + insertIndentsBeforeText(1, ''),
  );
});

it('should replace selected content with a new line', () => {
  const initialText = 'hello';
  const currentContent = ContentState.createFromText(initialText);
  const selectInitialtext = createSelection(currentContent);
  const before = EditorState.create({
    currentContent,
    // Focus the entire initial word
    selection: selectInitialtext.set('focusOffset', initialText.length),
  });

  const after = handleReturn({}, before);

  expect(toPlainText(before)).toEqual(initialText);
  expect(toPlainText(after)).toEqual(initialText + '\n');
});

it('should move indentation after inserting new line if cursor was between special characters, like "", {}, (), etc', () => {});
