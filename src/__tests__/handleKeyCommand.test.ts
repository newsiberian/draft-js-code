import {
  EditorState,
  ContentBlock,
  ContentState,
  SelectionState,
} from 'draft-js';
import detectIndent from 'detect-indent';

import { handleKeyCommand } from '../handleKeyCommand';
import {
  toPlainText,
  createWithText,
  createSelection,
  initialText,
  indentLength,
  insertIndentsBeforeText,
} from './utils';

jest.mock('../utils/moveSelectionToStartOfText', () => {
  return jest.fn(() => 'moveSelectionToStartOfText called');
});

jest.mock('../utils/deleteBlocks', () => {
  return jest.fn(() => 'deleteBlocks called');
});

jest.mock('../utils/duplicateBlocks', () => {
  return jest.fn(() => 'duplicateBlocks called');
});

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
    it('should remove all spaces between the indent and text beginning, if the indent is supposed', () => {
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

      const cursorAfterIndent = createSelection(currentContent)
        .set('anchorKey', 'a3')
        .set('anchorOffset', indentLength)
        .set('focusKey', 'a3')
        .set('focusOffset', indentLength);
      // "      const str = `this is test`;"
      //    ^ cursor should be here if indent === 2

      const cursor = detectIndent(insertIndentsBeforeText(3, testedText))
        .amount;
      const cursorBeforeText = createSelection(currentContent)
        .set('anchorKey', 'a3')
        .set('anchorOffset', cursor)
        .set('focusKey', 'a3')
        .set('focusOffset', cursor);
      // "      return 'hello'; // comment"
      //       ^ cursor should be here

      const editorState = EditorState.create({
        currentContent,
        selection: cursorAfterIndent,
      });

      const result = handleKeyCommand(editorState, 'backspace');
      const currectResult = `${firstText}\n${insertIndentsBeforeText(
        1,
        secondText,
      )}\n${insertIndentsBeforeText(1, testedText)}`;
      expect(toPlainText(result)).toEqual(currectResult);

      const editorStateCaseTwo = EditorState.create({
        currentContent,
        selection: cursorBeforeText,
      });

      const resultTwo = handleKeyCommand(editorStateCaseTwo, 'backspace');
      expect(toPlainText(resultTwo)).toEqual(currectResult);
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

  it('should move cursor position when deletig spaces between indentation and text beginning', () => {
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
    const cursor = detectIndent(insertIndentsBeforeText(3, testedText)).amount;
    // const currentContent = ContentState.createFromText(textWithCustomSpaces);
    const cursorAfterIndent = createSelection(currentContent)
      .set('anchorKey', 'a3')
      .set('anchorOffset', cursor)
      .set('focusKey', 'a3')
      .set('focusOffset', cursor);
    // "      const str = `this is test`;"
    //       ^ cursor should be here if indent === 2 * 3

    const editorState = EditorState.create({
      currentContent,
      selection: cursorAfterIndent,
    });

    const result = handleKeyCommand(editorState, 'backspace');
    const anchorOffsetAfter = result.getSelection().get('anchorOffset');
    expect(anchorOffsetAfter).toEqual(indentLength);
  });

  // it must transfer control above to RichUtils
  it('should remove all indentation then cursor at the beginning of text if line is first', () => {
    const textWithOneIndent = insertIndentsBeforeText(1);
    const currentContent = ContentState.createFromText(textWithOneIndent);
    // moving cursor to the beginning of text
    const cursorAfterIndent = createSelection(currentContent)
      .set('anchorOffset', indentLength)
      .set('focusOffset', indentLength);
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

    expect(firstBlock).toBeDefined();
    expect(firstBlock.getType()).not.toBe(secondBlock.getType());

    const selectSecondBlock = createSelection(currentContent)
      .set('anchorOffset', 0)
      .set('focusOffset', 0);
    const editorState = EditorState.create({
      currentContent,
      selection: selectSecondBlock,
    });

    const after = handleKeyCommand(editorState, 'backspace');
    expect(toPlainText(after)).toEqual(toPlainText(editorState));

    const currentContentTwo = ContentState.createFromBlockArray([firstBlock]);
    const selectFirstBlock = createSelection(currentContentTwo)
      .set('anchorOffset', 0)
      .set('focusOffset', 0);
    const editorStateTwo = EditorState.create({
      currentContent: currentContentTwo,
      selection: selectFirstBlock,
    });

    const afterTwo = handleKeyCommand(editorStateTwo, 'backspace');
    expect(toPlainText(afterTwo)).toEqual(toPlainText(editorStateTwo));
  });
});

describe('selection-to-start-of-text', () => {
  afterAll(() => {
    jest.unmock('../utils/moveSelectionToStartOfText');
  });

  it('should call moveSelectionToStartOfText', () => {
    const editorState = createWithText('');
    const result = handleKeyCommand(editorState, 'selection-to-start-of-text');
    expect(result).toBe('moveSelectionToStartOfText called');
  });
});

describe('delete-blocks', () => {
  afterAll(() => {
    jest.unmock('../utils/deleteBlocks');
  });

  it('should call deleteBlocks', () => {
    const editorState = createWithText('');
    const result = handleKeyCommand(editorState, 'delete-blocks');
    expect(result).toBe('deleteBlocks called');
  });
});

describe('duplicate-blocks', () => {
  afterAll(() => {
    jest.unmock('../utils/duplicateBlocks');
  });

  it('should call deleteBlocks', () => {
    const editorState = createWithText('');
    const result = handleKeyCommand(editorState, 'duplicate-blocks');
    expect(result).toBe('duplicateBlocks called');
  });
});

it('should not do anything for any other command', () => {
  const editorState = createWithText('');
  expect(handleKeyCommand(editorState, 'enter')).toEqual(undefined);
});
