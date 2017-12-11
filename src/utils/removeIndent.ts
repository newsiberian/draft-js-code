import { EditorState, Modifier } from 'draft-js';
// import * as detectIndent from 'detect-indent';
import detectIndent from 'detect-indent';

// import getNewLine from './getNewLine';
import { getIndentation } from './getIndentation';
// import getLines from './getLines';
// import getLineAnchorForOffset from './getLineAnchorForOffset';

export interface INewState {
  editorState: Draft.EditorState;
  contentState: Draft.ContentState;
  currentIndent?: number;
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
) => {
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

  // Detect newline separator and indentation
  // var newLine = getNewLine(blockText);
  const indent = getIndentation(blockText);
  const currentIndent = detectIndent(blockText).amount;
  // Get current line
  // var lines = getLines(blockText, newLine);
  // var lineAnchor = getLineAnchorForOffset(blockText, startOffset, newLine);

  // var currentLine = lines.get(lineAnchor.getLine());

  var rangeToRemove;
  var newState = <INewState>{
    editorState: editorState,
    contentState: contentState,
  };

  if (isShiftTab) {
    // if endKey differ from startKey this means that several lines selected and
    // we should remove indent from each (if possible)
    const endKey = selection.getEndKey();
    if (endKey !== startKey) {
      var state = false;
      var endPassed = false;
      // we need to collect selected lines indents for further selection calibration
      var linesIndents = {};
      var selectedBlocksRange = contentState
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
        newState = removeIndentFromLine(
          newState.editorState,
          newState.contentState,
          selection,
          block,
          key,
          indent,
        );
        linesIndents[key] = newState.currentIndent;
      });

      var calibratedAnchorOffset = function(offset, lineIndent, indent) {
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

      // newState.contentState = !selection.isBackward
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
            // selection.getIsBackward(),
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
            // selection.getIsBackward(),
          );
    } else {
      // exit if no indent
      if (blockText[0] !== ' ') {
        return editorState;
      }

      // we need to remove any number of spaces <= indent.length
      // i.e. if indent is 4, but we have 2 spaces on in the beginning of this line
      // we removing these 2
      var indentOffset =
        currentIndent < indent.length ? currentIndent : indent.length;
      // FIXME: this is dummy for testing purpose
      // var indentOffset = currentIndent < 4 ? currentIndent : 4;
      rangeToRemove = selection.merge({
        focusKey: startKey,
        focusOffset: indentOffset,
        anchorKey: startKey,
        anchorOffset: 0,
        isBackward: false,
      });

      newState = modifyEditorState(editorState, contentState, rangeToRemove);
      newState.contentState = calibrateCursor(
        newState.contentState,
        selection,
        startKey,
        endKey,
        selection.get('anchorOffset') - indent.length,
        // FIXME: this is dummy for testing purpose
        // selection.get('anchorOffset') - 4,
        selection.get('focusOffset') - indent.length,
        // FIXME: this is dummy for testing purpose
        // selection.get('focusOffset') - 4
      );
    }
  } else {
    var targetKey;
    var targetOffset;
    var isCursorOffsetEqualToIndent = currentIndent === startOffset;
    var isIndentLowerThanNativeIndent = currentIndent < indent.length;

    if (
      currentIndent < startOffset ||
      (isCursorOffsetEqualToIndent && isIndentLowerThanNativeIndent)
    ) {
      // second check for cases when text is closer to the line beginning than
      // indent, then we don't do anything here
      return;
    } else if (
      startOffset <= currentIndent &&
      currentIndent === indent.length
    ) {
      // if text begins from the position of indent, we should move it to
      // previous line if exist
      var blockBefore = contentState
        .getBlockMap()
        .toSeq()
        .takeUntil(contentBlock => contentBlock === currentBlock)
        .last();

      if (typeof blockBefore !== 'undefined') {
        targetKey = blockBefore.getKey();
        targetOffset = blockBefore.getLength();
      }
    }

    // Remove space before indent
    rangeToRemove = selection.merge({
      focusKey: targetKey || startKey,
      focusOffset: targetKey ? targetOffset : indent.length,
      anchorKey: startKey,
      anchorOffset: currentIndent,
      isBackward: true,
    });

    newState = modifyEditorState(editorState, contentState, rangeToRemove);
  }

  return EditorState.forceSelection(
    newState.editorState,
    newState.contentState.getSelectionAfter(),
  );
};

const removeIndentFromLine = (
  editorState: Draft.EditorState,
  contentState: Draft.ContentState,
  selection: Draft.SelectionState,
  block: Draft.ContentBlock,
  blockKey: string,
  indent: string,
): INewState => {
  const text = block.getText();
  // var newLine = getNewLine(text);
  // var lines = getLines(text, newLine);
  // var lineAnchor = getLineAnchorForOffset(text, 0, newLine);
  // var currentLine = lines.get(lineAnchor.getLine());
  const currentIndent = detectIndent(text).amount;

  if (currentIndent === 0) {
    return {
      editorState: editorState,
      contentState: contentState,
      currentIndent: currentIndent,
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

  const newState = modifyEditorState(editorState, contentState, rangeToRemove);

  return {
    editorState: newState.editorState,
    contentState: newState.contentState,
    currentIndent: currentIndent,
  };
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
): INewState => {
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
