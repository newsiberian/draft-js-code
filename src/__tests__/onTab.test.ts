import { EditorState, ContentState, SelectionState } from 'draft-js';

import { onTab } from '../onTab';
import { getIndentation } from '../utils/getIndentation';

const toPlainText = editorState =>
  editorState.getCurrentContent().getPlainText();
const createWithText = text => {
  const contentState = ContentState.createFromText(text);
  return EditorState.createWithContent(contentState);
};

const tabs = times => '    '.repeat(times || 1);
const evt = { preventDefault: jest.fn() };
const initialText = 'hello    hello';

// get default indent here
const indentLength = getIndentation(initialText).length;
// modify string with using default indent
const insertIndentsBeforeText = (modifier, text = initialText) => {
  const indentsLength = indentLength * modifier;
  let textWithIndents = `${text}`;
  for (let i = 0, l = indentsLength; i < l; i++) {
    textWithIndents = ` ${textWithIndents}`;
  }
  return textWithIndents;
};

it('should insert a tab', () => {
  const initialText = '';
  const before = createWithText(initialText);
  const after = onTab(evt, before);

  expect(toPlainText(before)).toEqual(initialText);
  expect(toPlainText(after)).toEqual(tabs(1));
});

it('should prevent the default event behavior', () => {
  const preventDefault = jest.fn();
  const evt = { preventDefault };
  const before = EditorState.createEmpty();

  onTab(evt, before);
  expect(preventDefault).toHaveBeenCalled();
});

it('should add a tab to an existing tab', () => {
  const initialText = tabs(1);
  const before = createWithText(initialText);
  const after = onTab(evt, before);

  expect(toPlainText(before)).toEqual(initialText);
  expect(toPlainText(after)).toEqual(initialText + tabs(1));
});

it('should replace selected content with the tab', () => {
  const initialText = 'hello';

  const currentContent = ContentState.createFromText(initialText);
  const selectInitialtext = SelectionState.createEmpty(
    currentContent
      .getBlockMap()
      .first()
      .getKey(),
  );
  const before = EditorState.create({
    allowUndo: true,
    currentContent,
    // Focus the entire initial word
    selection: selectInitialtext.set('focusOffset', initialText.length),
  });

  const after = onTab(evt, before);
  expect(toPlainText(before)).toEqual(initialText);
  expect(toPlainText(after)).toEqual(tabs(1));
});

it('should correctly indent several selected lines', () => {});

describe('on Shift+Tab', () => {
  // common settings
  evt.shiftKey = true;

  it('should correctly delete indentation from any cursor position', () => {
    const textWithOneIndent = insertIndentsBeforeText(1);
    const expectedText = initialText;
    const currentContent = ContentState.createFromText(textWithOneIndent);
    const currentBlock = SelectionState.createEmpty(
      currentContent
        .getBlockMap()
        .first()
        .getKey(),
    );
    const cursorAtTheBeginningOfLine = currentBlock
      .set('anchorOffset', 0)
      .set('focusOffset', 0);
    // "    hello    hello"
    //  ^ cursor here
    const cursorAtEndOfLine = currentBlock
      .set('anchorOffset', textWithOneIndent.length)
      .set('focusOffset', textWithOneIndent.length);
    // "    hello    hello"
    //                    ^ cursor here
    const cursorBeforeFirstWord = currentBlock
      .set('anchorOffset', 4)
      .set('focusOffset', 4);
    // "    hello    hello"
    //     ^ cursor here
    const cursorBeforeSecondWord = currentBlock
      .set('anchorOffset', 13)
      .set('focusOffset', 13);
    // "    hello    hello"
    //              ^ cursor here

    const before = EditorState.create({
      allowUndo: true,
      currentContent,
      selection: cursorAtTheBeginningOfLine,
    });
    const after = onTab(evt, before);
    expect(toPlainText(after)).toEqual(expectedText);

    const secondCaseBefore = EditorState.create({
      allowUndo: true,
      currentContent,
      selection: cursorAtEndOfLine,
    });
    const secondCaseAfter = onTab(evt, secondCaseBefore);
    expect(toPlainText(secondCaseAfter)).toEqual(expectedText);

    const thirdCaseBefore = EditorState.create({
      allowUndo: true,
      currentContent,
      selection: cursorBeforeFirstWord,
    });
    const thirdCaseAfter = onTab(evt, thirdCaseBefore);
    expect(toPlainText(thirdCaseAfter)).toEqual(expectedText);

    const fourthCaseBefore = EditorState.create({
      allowUndo: true,
      currentContent,
      selection: cursorBeforeSecondWord,
    });
    const fourthCaseAfter = onTab(evt, fourthCaseBefore);
    expect(toPlainText(fourthCaseAfter)).toEqual(expectedText);
  });

  it('should correctly delete indentation with backward and forward selection', () => {
    const textWithOneIndent = insertIndentsBeforeText(1);
    const expectedText = initialText;
    const currentContent = ContentState.createFromText(textWithOneIndent);
    const currentBlock = SelectionState.createEmpty(
      currentContent
        .getBlockMap()
        .first()
        .getKey(),
    );
    const backwardSelection = currentBlock
      .set('anchorOffset', 7)
      .set('focusOffset', 5);

    const forwardSelection = currentBlock
      .set('anchorOffset', 5)
      .set('focusOffset', 7);

    const before = EditorState.create({
      allowUndo: true,
      currentContent,
      selection: backwardSelection,
    });
    const after = onTab(evt, before);
    expect(toPlainText(after)).toEqual(expectedText);

    const beforeTwo = EditorState.create({
      allowUndo: true,
      currentContent,
      selection: forwardSelection,
    });
    const afterTwo = onTab(evt, beforeTwo);
    expect(toPlainText(afterTwo)).toEqual(expectedText);
  });

  it('should do nothing in any cursor position if no indentation presents', () => {
    const currentContent = ContentState.createFromText(initialText);
    const currentBlock = SelectionState.createEmpty(
      currentContent
        .getBlockMap()
        .first()
        .getKey(),
    );
    const cursorAtTheBeginningOfLine = currentBlock
      .set('anchorOffset', 0)
      .set('focusOffset', 0);
    const cursorBeforeSecondWord = currentBlock
      .set('anchorOffset', 9)
      .set('focusOffset', 9);
    // "hello    hello"
    //          ^ cursor here

    const before = EditorState.create({
      allowUndo: true,
      currentContent,
      selection: cursorAtTheBeginningOfLine,
    });
    const after = onTab(evt, before);
    expect(toPlainText(after)).toEqual(initialText);

    const beforeSecondCase = EditorState.create({
      allowUndo: true,
      currentContent,
      selection: cursorBeforeSecondWord,
    });
    const afterSecondCase = onTab(evt, beforeSecondCase);
    expect(toPlainText(afterSecondCase)).toEqual(initialText);
  });

  it('should correctly move cursor position after remove indentation', () => {
    const textWithOneIndent = insertIndentsBeforeText(1);
    const currentContent = ContentState.createFromText(textWithOneIndent);
    const currentBlock = SelectionState.createEmpty(
      currentContent
        .getBlockMap()
        .first()
        .getKey(),
    );
    const cursorBeforeSecondWord = currentBlock
      .set('anchorOffset', 13)
      .set('focusOffset', 13);
    // "    hello    hello"
    //              ^ cursor here
    //           ^ expected cursor position after test (if default indent === 4)

    const before = EditorState.create({
      allowUndo: true,
      currentContent,
      selection: cursorBeforeSecondWord,
    });
    const after = onTab(evt, before);
    const selection = after.getSelection();
    expect(selection.get('anchorOffset')).toEqual(13 - indentLength);
  });

  it('should delete one indentation per keys pressing', () => {
    const textWithOneIndent = insertIndentsBeforeText(1);
    const textWithTwoIndents = insertIndentsBeforeText(2);
    const currentContent = ContentState.createFromText(textWithTwoIndents);
    const selection = SelectionState.createEmpty(
      currentContent
        .getBlockMap()
        .first()
        .getKey(),
    )
      .set('anchorOffset', 9)
      .set('focusOffset', 9);

    const before = EditorState.create({
      allowUndo: true,
      currentContent,
      selection,
    });
    const after = onTab(evt, before);
    expect(toPlainText(after)).toEqual(textWithOneIndent);
  });

  it('should correctly remove indentation for several selected lines', () => {
    const lineOne = 'function test() {';
    const lineTwo = 'return "This is test";';
    const lineThree = '}';
    const combinedText = `${insertIndentsBeforeText(1, lineOne)}
${insertIndentsBeforeText(2, lineTwo)}
${insertIndentsBeforeText(1, lineThree)}`;
    const currentContent = ContentState.createFromText(combinedText);
    const contentBlocks = currentContent.getBlockMap();
    const firstBlockKey = contentBlocks.first().getKey();
    const lastBlockKey = contentBlocks.last().getKey();
    const selection = SelectionState.createEmpty(
      currentContent
        .getBlockMap()
        .first()
        .getKey(),
    );
    const allBlocksSelection = selection.merge({
      focusKey: lastBlockKey,
      focusOffset: 3, // random offset
      anchorKey: firstBlockKey,
      anchorOffset: 4, // random offset
    });

    const before = EditorState.create({
      allowUndo: true,
      currentContent,
      selection: allBlocksSelection,
    });
    const after = onTab(evt, before);

    expect(toPlainText(after)).toEqual(
      `${lineOne}
${insertIndentsBeforeText(1, lineTwo)}
${lineThree}`,
    );
  });
});
