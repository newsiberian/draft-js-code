import {
  EditorState,
  ContentBlock,
  ContentState,
  SelectionState,
} from 'draft-js';
import detectIndent from 'detect-indent';

import { handleKeyCommand } from '../handleKeyCommand';
import { getIndentation } from '../utils/getIndentation';
import {
  toPlainText,
  createWithText,
  createSelection,
  initialText,
  indentLength,
  insertIndentsBeforeText,
} from './utils';

describe('backspace', () => {
  describe('when cursor at the native indentation depth for current line', () => {
    //
    // explanation: vvv
    //
    // const insertIndentsBeforeText = modifier => {
    //   let text = `${initialText}`;
    // .. <-- native (one indent with 2 spaces) for ^^
    //   for (let i = 0, l = doubleIndent; i < l; i++) {
    //     text = ` ${text}`;
    // .... <-- native (two indents with 2 spaces) for ^^
    //   }
    // };
    // TODO we don't know yet how to let system know is indent should be or not
    it('should delete all space between indentation and text beginning if indentation should be', () => {
      const textWithOneIndent = insertIndentsBeforeText(1);
      const textWithCustomSpaces = `   ${textWithOneIndent}`;
      const currentContent = ContentState.createFromText(
        `function () {
            const x = 'hello';
            ${textWithCustomSpaces}
  }`,
      );
      // add more custom number of spaces to default indent
      // const textWithCustomSpaces = `   ${textWithOneIndent}`;
      // const currentContent = ContentState.createFromText(textWithCustomSpaces);
      const cursorAfterIndent = createSelection(currentContent)
        .set('anchorOffset', indentLength)
        .set('focusOffset', indentLength);
      // "       return 'hello'; // comment"
      //      ^ cursor should be here if indent === 4

      const cursor = detectIndent(textWithCustomSpaces).amount;
      const cursorBeforeText = createSelection(currentContent)
        .set('anchorOffset', cursor)
        .set('focusOffset', cursor);
      // "       return 'hello'; // comment"
      //        ^ cursor should be here if indent === 4

      const editorState = EditorState.create({
        allowUndo: true,
        currentContent,
        selection: cursorAfterIndent,
      });

      const result = handleKeyCommand(editorState, 'backspace');
      expect(toPlainText(result)).toEqual(textWithOneIndent);

      const editorStateCaseTwo = EditorState.create({
        allowUndo: true,
        currentContent,
        selection: cursorAfterIndent,
      });

      const resultTwo = handleKeyCommand(editorStateCaseTwo, 'backspace');
      expect(toPlainText(resultTwo)).toEqual(textWithOneIndent);
    });

    it('should move cursor position when deleting spaces between indentation and text beginning', () => {
      const textWithOneIndent = insertIndentsBeforeText(1);
      // add more custom number of spaces to default indent
      const textWithCustomSpaces = `   ${textWithOneIndent}`;
      const cursor = detectIndent(textWithCustomSpaces).amount;
      const currentContent = ContentState.createFromText(textWithCustomSpaces);
      const cursorAfterIndent = createSelection(currentContent)
        .set('anchorOffset', cursor)
        .set('focusOffset', cursor);
      // "       return 'hello'; // comment"
      //        ^ cursor should be here if indent === 4 + 3 spaces

      const editorState = EditorState.create({
        allowUndo: true,
        currentContent,
        selection: cursorAfterIndent,
      });

      const result = handleKeyCommand(editorState, 'backspace');
      const anchorOffsetAfter = result.getSelection().get('anchorOffset');
      expect(anchorOffsetAfter).toEqual(cursor - 3);
    });

    it('should move to previous line if exist, if text begin from the native indent', () => {
      const textWithIndent = insertIndentsBeforeText(1);
      const currentContent = ContentState.createFromText(
        `function () {
${textWithIndent}
  }`,
      );
      const cursorAfterIndent = SelectionState.createEmpty(
        currentContent
          .getBlockMap()
          .findKey(block => block.getText() === textWithIndent),
      )
        .set('anchorOffset', indentLength)
        .set('focusOffset', indentLength);

      const editorState = EditorState.create({
        allowUndo: true,
        currentContent,
        selection: cursorAfterIndent,
      });

      const result = handleKeyCommand(editorState, 'backspace');
      expect(toPlainText(result)).toEqual(`function () {${initialText}
  }`);
    });
  });

  // it must transfer control above to RichUtils
  it('should remove all indentation then cursor at the beginning of text if line is first', () => {
    const textWithOneIndent = insertIndentsBeforeText(1);
    const currentContent = ContentState.createFromText(textWithOneIndent);
    // moving cursor to the beginning of text
    const cursorAfterIndent = createSelection(currentContent)
      .set('anchorOffset', getIndentation())
      .set('focusOffset', getIndentation());
    const editorState = EditorState.create({
      currentContent,
      selection: cursorAfterIndent,
    });

    const result = handleKeyCommand(editorState, 'backspace');
    expect(toPlainText(result)).toEqual(initialText);
  });

  it('should skip handling if cursor located after text beginning', () => {
    const textWithIndent = `    ${initialText}`;
    const currentContent = ContentState.createFromText(textWithIndent);
    const cursorWithinText = createSelection(currentContent)
      .set('anchorOffset', 11)
      .set('focusOffset', 11);
    // "    return 'hello'; // comment"
    //             ^ cursor here

    const editorState = EditorState.create({
      allowUndo: true,
      currentContent,
      selection: cursorWithinText,
    });
    expect(handleKeyCommand(editorState, 'backspace')).toBeUndefined();
  });

  it('should not do anything on backspace if something is selected', () => {
    const currentContent = ContentState.createFromText(initialText);
    const selectInitialtext = createSelection(currentContent);
    const editorState = EditorState.create({
      allowUndo: true,
      currentContent,
      // Focus the entire initial word
      selection: selectInitialtext.set('focusOffset', initialText.length),
    });

    expect(handleKeyCommand(editorState, 'backspace')).toEqual(undefined);
  });

  it('should skip handling when text beginning from the content-block beginning', () => {
    const firstBlock = new ContentBlock({
      key: 'a1',
      text: 'const a = 1;',
      type: 'unstyled',
    });
    const secondBlock = new ContentBlock({
      key: 'a2',
      text: 'function () {',
      type: 'code-block',
    });
    const currentContent = ContentState.createFromBlockArray([
      firstBlock,
      secondBlock,
    ]);
    const selectSecondBlock = createSelection(currentContent)
      .set('anchorOffset', 0)
      .set('focusOffset', 0);
    const editorState = EditorState.create({
      allowUndo: true,
      currentContent,
      selection: selectSecondBlock,
    });

    const after = handleKeyCommand(editorState, 'backspace');
    expect(toPlainText(after)).toEqual(toPlainText(editorState));
  });
});

it('should not do anything for any other command', () => {
  const editorState = createWithText('');
  expect(handleKeyCommand(editorState, 'enter')).toEqual(undefined);
});
