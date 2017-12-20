import { EditorState, ContentState } from 'draft-js';

import { handleReturn } from '../handleReturn';
import {
  createSelection,
  insertIndentsBeforeText,
  initialText,
  indentLength,
  toPlainText,
} from './utils';

it('should insert a new line', () => {
  const currentContent = ContentState.createFromText(initialText);
  const afterLastCharacter = createSelection(currentContent)
    .set('anchorOffset', initialText.length)
    .set('focusOffset', initialText.length);

  const before = EditorState.create({
    currentContent,
    // Jump selection to the end of the line
    selection: afterLastCharacter,
  });
  const after = handleReturn({}, before);

  expect(toPlainText(before)).toEqual(initialText);
  expect(toPlainText(after)).toEqual(initialText + '\n');
});

it('should insert a new line at the same level of indentation', () => {
  const textWithOneIndent = insertIndentsBeforeText(1);
  const currentContent = ContentState.createFromText(textWithOneIndent);
  const afterLastCharacter = createSelection(currentContent)
    .set('anchorOffset', insertIndentsBeforeText(1).length)
    .set('focusOffset', insertIndentsBeforeText(1).length);

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
  const currentContent = ContentState.createFromText(initialText);
  const selectInitialText = createSelection(currentContent);
  const before = EditorState.create({
    currentContent,
    // Focus the entire initial word
    selection: selectInitialText.set('focusOffset', initialText.length),
  });

  const after = handleReturn({}, before);

  expect(toPlainText(before)).toEqual(initialText);
  expect(toPlainText(after)).toEqual('\n');
});

it('should move text after cursor to the next line (new block)', () => {
  const currentContent = ContentState.createFromText(initialText);
  const selection = createSelection(currentContent)
    .set('anchorOffset', initialText.length - 3)
    .set('focusOffset', initialText.length - 3);
  const before = EditorState.create({ currentContent, selection });
  const after = handleReturn({}, before);

  const textBeginning = initialText.substring(0, initialText.length - 3);
  const textEnd = initialText.substring(initialText.length - 3);

  expect(toPlainText(before)).toEqual(initialText);
  expect(toPlainText(after)).toEqual(`${textBeginning}\n${textEnd}`);
});

it('should move indentation after inserting new line if cursor was between special characters, like "", {}, (), etc', () => {
  const currentContent = ContentState.createFromText('{}');
  const selection = createSelection(currentContent)
    .set('anchorOffset', 1)
    .set('focusOffset', 1);
  const before = EditorState.create({ currentContent, selection });
  const after = handleReturn({}, before);

  expect(toPlainText(after)).toEqual(
    `${'{'}\n${insertIndentsBeforeText(1, '')}\n${'}'}`,
  );
});

it('should act as always if no closed char after opening block char (`{`, `[`, `(`)', () => {
  const currentContent = ContentState.createFromText('{');
  const selection = createSelection(currentContent)
    .set('anchorOffset', 1)
    .set('focusOffset', 1);
  const before = EditorState.create({ currentContent, selection });
  const after = handleReturn({}, before);

  expect(toPlainText(after)).toEqual(
    `${'{'}\n${insertIndentsBeforeText(1, '')}`,
  );
});
