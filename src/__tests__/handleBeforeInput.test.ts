import { EditorState, ContentState } from 'draft-js';

import { specialChars } from '../utils/specialChars';
import { handleBeforeInput } from '../handleBeforeInput';
import { createSelection, initialText, toPlainText } from './utils';

describe('handleBeforeInput', () => {
  it('should insert special character pair', () => {
    const text = "return 'hello'; // comment";
    const currentContent = ContentState.createFromText(text);
    const forwardSelection = createSelection(currentContent)
      .set('anchorOffset', 14)
      .set('focusOffset', 15);
    // return 'hello'; // comment
    //               ^ <-- cursor here

    const editorState = EditorState.create({
      currentContent,
      selection: forwardSelection,
    });

    const result = handleBeforeInput('{', editorState);
    expect(toPlainText(result)).toEqual("return 'hello'{} // comment");
  });

  it('should not insert special character pair if next character exist', () => {
    const currentContent = ContentState.createFromText(initialText);
    const forwardSelection = createSelection(currentContent)
      .set('anchorOffset', 16)
      .set('focusOffset', 16);
    // return 'hello'; // comment
    //                ^ <-- cursor here

    const editorState = EditorState.create({
      currentContent,
      selection: forwardSelection,
    });

    expect(handleBeforeInput('{', editorState)).toBeUndefined();
  });

  it('should move cursor between pair characters', () => {
    const text = "return 'hello'; // comment";
    const currentContent = ContentState.createFromText(initialText);
    const forwardSelection = createSelection(currentContent)
      .set('anchorOffset', 15)
      .set('focusOffset', 15);
    // return 'hello'; // comment
    //               ^ <-- cursor here

    const editorState = EditorState.create({
      currentContent,
      selection: forwardSelection,
    });

    const result = handleBeforeInput('{', editorState);
    const selectionAfter = result.getSelection();
    expect(selectionAfter.getAnchorOffset()).toEqual(
      selectionAfter.getFocusOffset(),
    );
    expect(selectionAfter.getAnchorOffset()).toBe(16);
    // return 'hello';{ } // comment
    //                 ^ <-- should be here (brackets w/o space)
  });

  it('should insert pair for all special characters', () => {
    specialChars.forEach((charStats, char) => {
      const partOne = "return 'hello';";
      const partTwo = ' // comment';
      const currentContent = ContentState.createFromText(partOne + partTwo);
      const forwardSelection = createSelection(currentContent)
        .set('anchorOffset', 15)
        .set('focusOffset', 15);
      // return 'hello'; // comment
      //               ^ <-- cursor here

      const editorState = EditorState.create({
        currentContent,
        selection: forwardSelection,
      });

      const result = handleBeforeInput(char, editorState);
      expect(toPlainText(result)).toEqual(
        `${partOne}${charStats.pair}${partTwo}`,
      );
    });
  });
});
