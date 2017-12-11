import { EditorState, ContentState, SelectionState } from 'draft-js';
import detectIndent from 'detect-indent';

import { handleKeyCommand } from '../handleKeyCommand';
import { getIndentation } from '../utils/getIndentation';

const toPlainText = (editorState: Draft.EditorState): string =>
  editorState.getCurrentContent().getPlainText();

const createWithText = (text: string): Draft.EditorState => {
  const contentState = ContentState.createFromText(text);
  return EditorState.createWithContent(contentState);
};

const initialText = "return 'hello'; // comment";
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
    it('should delete all space between indentation and text beginning', () => {
      const textWithOneIndent = insertIndentsBeforeText(1);
      // add more custom number of spaces to default indent
      const textWithCustomSpaces = `   ${textWithOneIndent}`;
      const currentContent = ContentState.createFromText(textWithCustomSpaces);
      const cursorAfterIndent = SelectionState.createEmpty(
        currentContent
          .getBlockMap()
          .first()
          .getKey(),
      )
        .set('anchorOffset', indentLength)
        .set('focusOffset', indentLength);
      // "       return 'hello'; // comment"
      //      ^ cursor should be here if indent === 4

      const cursor = detectIndent(textWithCustomSpaces).amount;
      const cursorBeforeText = SelectionState.createEmpty(
        currentContent
          .getBlockMap()
          .first()
          .getKey(),
      )
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
      const cursorAfterIndent = SelectionState.createEmpty(
        currentContent
          .getBlockMap()
          .first()
          .getKey(),
      )
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

    // it must transfer control above to RichUtils
    // it('should skip deleting of indentation when cursor at the beginning of text and it\'s match with indentation', () => {
    //
    // });

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

  it('should skip handling if cursor located after text beginning', () => {
    const textWithIndent = `    ${initialText}`;
    const currentContent = ContentState.createFromText(textWithIndent);
    const cursorWithinText = SelectionState.createEmpty(
      currentContent
        .getBlockMap()
        .first()
        .getKey(),
    )
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
    const initialText = 'hello';

    const currentContent = ContentState.createFromText(initialText);
    const selectInitialtext = SelectionState.createEmpty(
      currentContent
        .getBlockMap()
        .first()
        .getKey(),
    );
    const editorState = EditorState.create({
      allowUndo: true,
      currentContent,
      // Focus the entire initial word
      selection: selectInitialtext.set('focusOffset', initialText.length),
    });

    expect(handleKeyCommand(editorState, 'backspace')).toEqual(undefined);
  });
});

it('should not do anything for any other command', () => {
  const editorState = createWithText('');
  expect(handleKeyCommand(editorState, 'enter')).toEqual(undefined);
});
