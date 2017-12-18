import { EditorState, ContentBlock, ContentState } from 'draft-js';

import { onTab } from '../onTab';
import {
  toPlainText,
  createWithText,
  createSelection,
  initialText,
  indentLength,
  insertIndentsBeforeText,
} from './utils';

const evt = { preventDefault: jest.fn() };

describe('on Tab', () => {
  evt.shiftKey = false;

  it('should insert a tab', () => {
    const before = createWithText(initialText);
    const after = onTab(evt, before);

    expect(toPlainText(before)).toEqual(initialText);
    expect(toPlainText(after)).toEqual(insertIndentsBeforeText(1));
  });

  it('should prevent the default event behavior', () => {
    const preventDefault = jest.fn();
    const event = { preventDefault };
    const before = EditorState.createEmpty();

    onTab(event, before);
    expect(preventDefault).toHaveBeenCalled();
  });

  it('should add a tab to an existing tab', () => {
    const textWithOneTab = insertIndentsBeforeText(1);
    const before = createWithText(textWithOneTab);
    const after = onTab(evt, before);

    expect(toPlainText(before)).toEqual(textWithOneTab);
    expect(toPlainText(after)).toEqual(insertIndentsBeforeText(2));
  });

  it('should not replace selected content with the tab', () => {
    const currentContent = ContentState.createFromText(initialText);
    const selectInitialtext = createSelection(currentContent).set(
      'focusOffset',
      initialText.length,
    );

    const before = EditorState.create({
      allowUndo: true,
      currentContent,
      // Focus the entire initial word
      selection: selectInitialtext,
    });

    const after = onTab(evt, before);
    expect(toPlainText(before)).toEqual(initialText);
    expect(toPlainText(after)).toEqual(insertIndentsBeforeText(1));
  });

  it('should keep selection position on indent inserting', () => {
    const currentContent = ContentState.createFromText(initialText);
    // forward selection
    const forwardSelection = createSelection(currentContent)
      .set('anchorOffset', 1)
      .set('focusOffset', 3);

    const forwardOneBefore = EditorState.create({
      allowUndo: true,
      currentContent,
      // Focus the entire initial word
      selection: forwardSelection,
    });
    const forwardOneAfter = onTab(evt, forwardOneBefore);
    const selectionAfterFirstforwardMove = forwardOneAfter.getSelection();
    expect(selectionAfterFirstforwardMove.toJS()).toHaveProperty(
      'anchorOffset',
      1 + indentLength,
    );
    expect(selectionAfterFirstforwardMove.toJS()).toHaveProperty(
      'focusOffset',
      3 + indentLength,
    );

    // second iteration
    const forwardTwoBefore = onTab(evt, forwardOneAfter);
    const selectionAfterSecondforwardMove = forwardTwoBefore.getSelection();
    expect(selectionAfterSecondforwardMove.toJS()).toHaveProperty(
      'anchorOffset',
      1 + indentLength * 2,
    );
    expect(selectionAfterSecondforwardMove.toJS()).toHaveProperty(
      'focusOffset',
      3 + indentLength * 2,
    );

    const backwardSelection = createSelection(currentContent)
      .set('anchorOffset', 3)
      .set('focusOffset', 1)
      .set('isBackward', true);

    const backwardOneBefore = EditorState.create({
      allowUndo: true,
      currentContent,
      // Focus the entire initial word
      selection: backwardSelection,
    });
    const backwardOneAfter = onTab(evt, backwardOneBefore);
    const selectionAfterFirstBackwardMove = backwardOneAfter.getSelection();
    expect(selectionAfterFirstBackwardMove.toJS()).toHaveProperty(
      'anchorOffset',
      3 + indentLength,
    );
    expect(selectionAfterFirstBackwardMove.toJS()).toHaveProperty(
      'focusOffset',
      1 + indentLength,
    );

    // second iteration
    const backwardTwoBefore = onTab(evt, backwardOneAfter);
    const selectionAfterSecondBackwardMove = backwardTwoBefore.getSelection();
    expect(selectionAfterSecondBackwardMove.toJS()).toHaveProperty(
      'anchorOffset',
      3 + indentLength * 2,
    );
    expect(selectionAfterSecondBackwardMove.toJS()).toHaveProperty(
      'focusOffset',
      1 + indentLength * 2,
    );
  });

  it('should correctly indent several selected lines', () => {
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
    const selection = createSelection(currentContent);
    const allBlocksSelection = selection.merge({
      focusKey: lastBlockKey,
      focusOffset: 3, // random offset
      anchorKey: firstBlockKey,
      anchorOffset: 4, // random offset
    });

    const before = EditorState.create({
      currentContent,
      selection: allBlocksSelection,
    });
    const after = onTab(evt, before);

    expect(toPlainText(after)).toEqual(
      `${insertIndentsBeforeText(2, lineOne)}
${insertIndentsBeforeText(3, lineTwo)}
${insertIndentsBeforeText(2, lineThree)}`,
    );
  });
});

describe('on Shift+Tab', () => {
  beforeAll(() => (evt.shiftKey = true));

  it('should correctly delete indentation from any cursor position', () => {
    const textWithOneIndent = insertIndentsBeforeText(1);
    const expectedText = initialText;
    const currentContent = ContentState.createFromText(textWithOneIndent);
    const selection = createSelection(currentContent);

    const cursorAtTheBeginningOfLine = selection
      .set('anchorOffset', 0)
      .set('focusOffset', 0);
    // "    hello    hello"
    //  ^ cursor here
    const cursorAtEndOfLine = selection
      .set('anchorOffset', textWithOneIndent.length)
      .set('focusOffset', textWithOneIndent.length);
    // "    hello    hello"
    //                    ^ cursor here
    const cursorBeforeFirstWord = selection
      .set('anchorOffset', 4)
      .set('focusOffset', 4);
    // "    hello    hello"
    //     ^ cursor here
    const cursorBeforeSecondWord = selection
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
    const selection = createSelection(currentContent);

    const backwardSelection = selection
      .set('anchorOffset', 7)
      .set('focusOffset', 5)
      .set('isBackward', true);

    const forwardSelection = selection
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
    const selection = createSelection(currentContent);

    const cursorAtTheBeginningOfLine = selection
      .set('anchorOffset', 0)
      .set('focusOffset', 0);
    const cursorBeforeSecondWord = selection
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
    const selection = createSelection(currentContent);

    const cursorBeforeSecondWord = selection
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
    const selection = createSelection(currentContent)
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
    const selection = createSelection(currentContent);
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
      .set('anchorKey', 'a2')
      .set('anchorOffset', 0)
      .set('focusKey', 'a2')
      .set('focusOffset', 0);
    const editorState = EditorState.create({
      allowUndo: true,
      currentContent,
      selection: selectSecondBlock,
    });

    const after = onTab(evt, editorState);
    expect(toPlainText(after)).toEqual(toPlainText(editorState));
  });

  it('should skip using as `lastBlockBefore` block of the another type than current', () => {
    const firstText = 'const a = 1;';
    const firstBlock = new ContentBlock({
      key: 'a1',
      text: firstText,
      type: 'unstyled',
    });
    const secondText = 'function () {';
    const secondBlock = new ContentBlock({
      key: 'a2',
      text: insertIndentsBeforeText(2, secondText),
      type: 'code-block',
    });
    const currentContent = ContentState.createFromBlockArray([
      firstBlock,
      secondBlock,
    ]);
    const selectSecondBlock = createSelection(currentContent)
      .set('anchorKey', 'a2')
      .set('anchorOffset', indentLength * 2)
      .set('focusKey', 'a2')
      .set('focusOffset', indentLength * 2);
    const editorState = EditorState.create({
      currentContent,
      selection: selectSecondBlock,
    });

    const after = onTab(evt, editorState);
    expect(toPlainText(after)).toEqual(
      `${firstText}\n${insertIndentsBeforeText(1, secondText)}`,
    );
  });

  it('should remove indent if previous block of the same type has no indent', () => {
    const firstText = 'const a = 1;';
    const firstBlock = new ContentBlock({
      key: 'a1',
      text: firstText,
      type: 'code-block',
    });
    const secondText = 'function () {';
    const secondBlock = new ContentBlock({
      key: 'a2',
      text: insertIndentsBeforeText(2, secondText),
      type: 'code-block',
    });
    const currentContent = ContentState.createFromBlockArray([
      firstBlock,
      secondBlock,
    ]);
    const selectSecondBlock = createSelection(currentContent)
      .set('anchorKey', 'a2')
      .set('anchorOffset', indentLength * 2)
      .set('focusKey', 'a2')
      .set('focusOffset', indentLength * 2);
    const editorState = EditorState.create({
      currentContent,
      selection: selectSecondBlock,
    });

    const after = onTab(evt, editorState);
    expect(toPlainText(after)).toEqual(
      `${firstText}\n${insertIndentsBeforeText(1, secondText)}`,
    );
  });
});
