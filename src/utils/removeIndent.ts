import { EditorState, Modifier } from 'draft-js';
import detectIndent from 'detect-indent';

import * as Immutable from 'immutable';

import { detectIndentation } from './detectIndentation';
import { getSelectedBlocks } from './getSelectedBlocks';
import getIndentation from './getIndentation';

export interface NewStateInterface {
  editorState: EditorState;
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
  editorState: EditorState,
  isShiftTab: boolean,
): EditorState | void => {
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
  const currentType = currentBlock.getType();

  const currentIndent = <number>detectIndent(blockText).amount;

  const blockMapBefore = contentState
    .getBlockMap()
    .takeUntil((value, key) => key === startKey);

  const lastBlockBefore = <Draft.ContentBlock>getLastBlockBefore(
    blockMapBefore,
    currentType,
  );

  const indent = detectIndentation(lastBlockBefore);
  const defaultIndent = getIndentation();

  // if previous block was not `code-block` and we are at the beginning of line,
  // we don't do any action to prevent current `code-block` removing
  if (
    currentIndent < 1 &&
    startOffset < 1 &&
    (typeof lastBlockBefore === 'undefined' ||
      lastBlockBefore.getType() !== currentBlock.getType())
  ) {
    return editorState;
  }

  const newState = <NewStateInterface>{
    editorState,
    contentState,
  };

  if (isShiftTab) {
    // if endKey differ from startKey this means that several lines selected and
    // we should remove indent from each (if possible)
    const endKey = selection.getEndKey();
    if (endKey !== startKey) {
      // we need to collect selected lines indents for further selection calibration
      const linesIndents = {};
      const selectedBlocksRange = getSelectedBlocks(
        contentState,
        startKey,
        endKey,
      );

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
            calibrateOffset(
              selection.get('anchorOffset'),
              linesIndents[startKey],
              indent.length,
            ),
            calibrateOffset(
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
            calibrateOffset(
              selection.get('anchorOffset'),
              linesIndents[endKey],
              indent.length,
            ),
            calibrateOffset(
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

      const rangeToRemove = <Draft.SelectionState>selection.merge({
        focusKey: startKey,
        focusOffset: defaultIndent,
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
        selection.get('anchorOffset') - defaultIndent,
        selection.get('focusOffset') - defaultIndent,
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

const getLastBlockBefore = (
  blockMap: Immutable.OrderedMap<string, Draft.ContentBlock>,
  currentType: string,
): Draft.ContentBlock | void => {
  const last = blockMap.last();
  if (typeof last !== 'undefined' && last.getType() === currentType) {
    return blockMap.last();
  }
};

const removeIndentFromLine = (
  editorState: EditorState,
  contentState: Draft.ContentState,
  selection: Draft.SelectionState,
  block: Draft.ContentBlock,
  blockKey: string,
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

  const indent = getIndentation();
  const rangeToRemove = <Draft.SelectionState>selection.merge({
    focusKey: blockKey,
    focusOffset: currentIndent >= indent ? currentIndent - indent : 0,
    anchorKey: blockKey,
    anchorOffset: currentIndent,
    isBackward: true,
  });

  return {
    ...modifyEditorState(editorState, contentState, rangeToRemove),
    currentIndent,
  };
};

// export only for testing
export const calibrateOffset = (
  offset: number,
  lineIndent: number,
  indent: number,
): number => {
  if (lineIndent < 1) {
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
  editorState: EditorState,
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

const forceSelection = ({ editorState, contentState }): EditorState =>
  EditorState.forceSelection(editorState, contentState.getSelectionAfter());
