import { EditorState, Modifier } from 'draft-js';
// import * as detectIndent from 'detect-indent';
import detectIndent from 'detect-indent';

// import getNewLine from './getNewLine';
// import { getIndentation } from './getIndentation';
import { detectIndentation } from './detectIndentation';

export interface NewStateInterface {
  editorState: Draft.EditorState;
  contentState: Draft.ContentState;
  currentIndent?: number;
}

interface TargetInterface {
  key: string;
  offset: number;
}

/**
 * Remove last indentation before cursor, return undefined if no modification is done
 *
 * @param {Draft.EditorState} editorState
 * @param {Boolean} isShiftTab
 * @return {Draft.EditorState|Undefined}
 */
export const removeIndent = (
  editorState: Draft.EditorState,
  isShiftTab: boolean,
): Draft.EditorState | void => {
  const contentState = editorState.getCurrentContent();
  const selection = editorState.getSelection();

  // backspace pressing with selection should remove selection
  if (!selection.isCollapsed() && !isShiftTab) {
    return;
  }

  const startKey = selection.getStartKey();
  const startOffset = selection.getStartOffset();
  const currentBlock = contentState.getBlockForKey(startKey);
  const blockText = currentBlock.getText();

  const indent = detectIndentation(blockText);
  const currentIndent = detectIndent(blockText).amount;

  const newState = <NewStateInterface>{
    editorState,
    contentState,
  };

  if (isShiftTab) {
    // if endKey differ from startKey this means that several lines selected and
    // we should remove indent from each (if possible)
    const endKey = selection.getEndKey();
    if (endKey !== startKey) {
      let state = false;
      let endPassed = false;
      // we need to collect selected lines indents for further selection calibration
      const linesIndents = {};
      const selectedBlocksRange = contentState
        .getBlockMap()
        .filter((value, key) => {
          if (endPassed) {
            return false;
          } else if (key === startKey) {
            state = true;
          } else if (key === endKey) {
            endPassed = true;
          }
          return state;
        });

      selectedBlocksRange.forEach((block, key) => {
        // destructuring with renaming
        const {
          editorState: newEditorState,
          contentState: newContentState,
          currentIndent: newCurrentIndent,
        } = removeIndentFromLine(
          newState.editorState,
          newState.contentState,
          selection,
          block,
          key,
          indent,
        );
        linesIndents[key] = newCurrentIndent;
        newState.editorState = newEditorState;
        newState.contentState = newContentState;
        newState.currentIndent = newCurrentIndent;
      });

      newState.contentState = !selection.getIsBackward()
        ? calibrateCursor(
            newState.contentState,
            selection,
            startKey,
            endKey,
            calibratedAnchorOffset(
              selection.get('anchorOffset'),
              linesIndents[startKey],
              indent.length,
            ),
            calibratedAnchorOffset(
              selection.get('focusOffset'),
              linesIndents[endKey],
              indent.length,
            ),
          )
        : calibrateCursor(
            newState.contentState,
            selection,
            endKey,
            startKey,
            calibratedAnchorOffset(
              selection.get('anchorOffset'),
              linesIndents[endKey],
              indent.length,
            ),
            calibratedAnchorOffset(
              selection.get('focusOffset'),
              linesIndents[startKey],
              indent.length,
            ),
          );

      return forceSelection({
        editorState: newState.editorState,
        contentState: newState.contentState,
      });
    } else {
      // exit if no indent
      if (blockText[0] !== ' ') {
        return editorState;
      }

      // we need to remove any number of spaces <= indent.length
      // i.e. if indent is 4, but we have 2 spaces on in the beginning of this line
      // we removing these 2
      const indentOffset =
        currentIndent < indent.length ? currentIndent : indent.length;

      const rangeToRemove = <Draft.SelectionState>selection.merge({
        focusKey: startKey,
        focusOffset: indentOffset,
        anchorKey: startKey,
        anchorOffset: 0,
        isBackward: false,
      });

      const modifiedSingleLineState = modifyEditorState(
        editorState,
        contentState,
        rangeToRemove,
      );
      modifiedSingleLineState.contentState = calibrateCursor(
        modifiedSingleLineState.contentState,
        selection,
        startKey,
        endKey,
        selection.get('anchorOffset') - indent.length,
        selection.get('focusOffset') - indent.length,
      );

      return forceSelection(modifiedSingleLineState);
    }
  } else {
    const target = <TargetInterface>{};
    const isCursorOffsetEqualToIndent = currentIndent === startOffset;
    const isIndentLowerThanNativeIndent = currentIndent < indent.length;

    if (
      currentIndent < startOffset ||
      (isCursorOffsetEqualToIndent && isIndentLowerThanNativeIndent)
    ) {
      // second check for cases when text is closer to the line beginning than
      // indent, then we don't do anything here
      return;
    }

    // if text begins from the position of indent, we should move it to
    // previous line if exist
    const blockBefore = contentState
      .getBlockMap()
      .toSeq()
      .takeUntil(contentBlock => contentBlock === currentBlock)
      .last();

    if (typeof blockBefore === 'undefined') {
      // move text to the beginning of line if this is a first line of parent
      // block
      target.offset = 0;
    } else if (
      startOffset <= currentIndent &&
      currentIndent === indent.length
    ) {
      // move text to the end of previous block
      target.key = blockBefore.getKey();
      target.offset = blockBefore.getLength();
    }

    // Remove space before indent
    const rangeToRemove = <Draft.SelectionState>selection.merge({
      focusKey: target.key || startKey,
      focusOffset:
        typeof target.offset === 'number' ? target.offset : indent.length,
      anchorKey: startKey,
      anchorOffset: currentIndent,
      isBackward: true,
    });

    return forceSelection(
      modifyEditorState(editorState, contentState, rangeToRemove),
    );
  }
};

const removeIndentFromLine = (
  editorState: Draft.EditorState,
  contentState: Draft.ContentState,
  selection: Draft.SelectionState,
  block: Draft.ContentBlock,
  blockKey: string,
  indent: string,
): NewStateInterface => {
  const text = block.getText();
  const currentIndent = detectIndent(text).amount;

  if (currentIndent === 0) {
    return {
      editorState,
      contentState,
      currentIndent,
    };
  }

  const rangeToRemove = <Draft.SelectionState>selection.merge({
    focusKey: blockKey,
    focusOffset:
      currentIndent >= indent.length ? currentIndent - indent.length : 0,
    anchorKey: blockKey,
    anchorOffset: currentIndent,
    isBackward: true,
  });

  return {
    ...modifyEditorState(editorState, contentState, rangeToRemove),
    currentIndent,
  };
};

const calibratedAnchorOffset = function(offset, lineIndent, indent) {
  if (lineIndent === 0) {
    return offset;
  }

  if (offset < lineIndent) {
    if (lineIndent > indent) {
      return offset;
    }
    return 0;
  }

  return lineIndent >= indent ? offset - indent : offset - lineIndent;
};

const calibrateCursor = (
  contentState: Draft.ContentState,
  selection: Draft.SelectionState,
  anchorKey: string,
  focusKey: string,
  anchorOffset: number,
  focusOffset: number,
): Draft.ContentState => {
  return <Draft.ContentState>contentState.merge({
    selectionAfter: selection.merge({
      anchorKey: anchorKey,
      anchorOffset: anchorOffset,
      focusKey: focusKey,
      focusOffset: focusOffset,
    }),
  });
};

const modifyEditorState = (
  editorState: Draft.EditorState,
  contentState: Draft.ContentState,
  rangeToRemove: Draft.SelectionState,
): NewStateInterface => {
  const newContentState = Modifier.removeRange(
    contentState,
    rangeToRemove,
    'backward',
  );
  const newEditorState = EditorState.push(
    editorState,
    newContentState,
    'remove-range',
  );

  return {
    editorState: newEditorState,
    contentState: newContentState,
  };
};

const forceSelection = ({ editorState, contentState }) =>
  EditorState.forceSelection(editorState, contentState.getSelectionAfter());
