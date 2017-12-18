import { ContentState } from 'draft-js';

import { detectNextCharacter } from '../utils/detectNextCharacter';
import { createSelection, initialText } from './utils';

describe('detectNextCharacter', () => {
  it('should detect next character', () => {
    const currentContent = ContentState.createFromText(initialText);
    const forwardSelection = createSelection(currentContent)
      .set('anchorOffset', 6)
      .set('focusOffset', 7);
    // return 'hello'; // comment
    //       ^ <-- cursor here
    const backwardSelection = createSelection(currentContent)
      .set('anchorOffset', 16)
      .set('focusOffset', 15)
      .set('isBackward', true);
    // return 'hello'; // comment
    //                ^ <-- cursor here

    const forwardResult = detectNextCharacter(currentContent, forwardSelection);
    expect(forwardResult).toBeTruthy();

    const backwardResult = detectNextCharacter(
      currentContent,
      backwardSelection,
    );
    expect(backwardResult).toBeTruthy();
  });

  it('should correctly detect spaces, tabs, etc characters', () => {
    const texts = [
      ' ', // end of line
      '\r', // end of line
      '  ', // 2 spaces
      '\t\t', // 2 tabs
      '\n',
      '\f',
      '\r',
      '\v',
      // tslint:disable-next-line
      `
      `, // space + end of line
    ];

    texts.forEach(text => {
      const contentWithSpaces = ContentState.createFromText(text[0]);
      const selectionWithSpaces = createSelection(contentWithSpaces)
        .set('anchorOffset', 0)
        .set('focusOffset', 0);

      const resultWithSpaces = detectNextCharacter(
        contentWithSpaces,
        selectionWithSpaces,
      );
      expect(resultWithSpaces).toBeFalsy();
    });
  });

  it('should allow insert pair of special character between block characters', () => {
    const text = 'aaa[]bbb';
    const currentContent = ContentState.createFromText(text);
    const forwardSelection = createSelection(currentContent)
      .set('anchorOffset', 4)
      .set('focusOffset', 4);

    const forwardResult = detectNextCharacter(currentContent, forwardSelection);
    // ] is not recognized as a character (this is expected)
    expect(forwardResult).toBeFalsy();
  });
});
