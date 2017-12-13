import { EditorState, Modifier } from 'draft-js';

import * as React from 'react';

import { getIndentation } from './utils/getIndentation';
import { detectIndentation } from './utils/detectIndentation';
import { removeIndent } from './utils/removeIndent';
import { getSelectedBlocks } from './utils/getSelectedBlocks';

type SyntheticKeyboardEvent = React.KeyboardEvent<{}>;

// TODO: tab should complete indentation instead of just inserting one

/**
 * Handle pressing tab in the editor
 */
export const onTab = (
  e: SyntheticKeyboardEvent,
  editorState: Draft.EditorState,
): Draft.EditorState | void => {
  e.preventDefault();

  if (e.shiftKey) {
    return removeIndent(editorState, true);
  }

  const contentState = editorState.getCurrentContent();
  const selection = editorState.getSelection();
  const startKey = selection.getStartKey();
  const endKey = selection.getEndKey();
  const currentBlock = contentState.getBlockForKey(startKey);

  // handle several lines selection
  if (endKey !== startKey) {
    const newState = { contentState, selection };
    const selectedBlocks = getSelectedBlocks(contentState, startKey, endKey);

    selectedBlocks.forEach((block, key) => {
      newState.contentState = indentBlock(
        newState.contentState,
        newState.selection,
        key,
      );
    });

    // now we need to calibrate selection
    const calibratedState = <Draft.ContentState>newState.contentState.merge({
      selectionAfter: selection.merge(
        selection.getIsBackward()
          ? {
              anchorKey: endKey,
              anchorOffset: selection.get('anchorOffset') + getIndentation(),
              focusKey: startKey,
              focusOffset: selection.get('focusOffset') + getIndentation(),
            }
          : {
              anchorKey: startKey,
              anchorOffset: selection.get('anchorOffset') + getIndentation(),
              focusKey: endKey,
              focusOffset: selection.get('focusOffset') + getIndentation(),
            },
      ),
    });

    const modifiedState = EditorState.push(
      editorState,
      newState.contentState,
      'insert-characters',
    );
    return EditorState.forceSelection(
      modifiedState,
      calibratedState.getSelectionAfter(),
    );
  }

  const indentation = detectIndentation(currentBlock.getText());

  const newContentState = selection.isCollapsed()
    ? Modifier.insertText(contentState, selection, indentation)
    : moveTextWithSelectionCalibration(contentState, selection, indentation);

  return EditorState.push(editorState, newContentState, 'insert-characters');
};

/**
 * Keep insert indentation even if selection presents. Selection also moved
 * on indentation length
 * @param {Draft.Model.ImmutableData.ContentState} contentState
 * @param {Draft.Model.ImmutableData.SelectionState} selection
 * @param {string} indentation
 * @return {Draft.Model.ImmutableData.ContentState}
 */
const moveTextWithSelectionCalibration = (
  contentState: Draft.ContentState,
  selection: Draft.SelectionState,
  indentation: string,
): Draft.ContentState => {
  const selectionWithoutOffset = <Draft.SelectionState>selection.merge({
    anchorOffset: 0,
    focusOffset: 0,
  });
  const newContentState = Modifier.insertText(
    contentState,
    selectionWithoutOffset,
    indentation,
  );

  return <Draft.ContentState>newContentState.merge({
    selectionAfter: selection.merge(
      selection.merge({
        anchorOffset: selection.getAnchorOffset() + getIndentation(),
        focusOffset: selection.getFocusOffset() + getIndentation(),
      }),
    ),
    selectionBefore: selection,
  });
};

/**
 * Insert indentation in the block beginning with moving text
 * @param {Draft.Model.ImmutableData.ContentState} contentState
 * @param {Draft.Model.ImmutableData.SelectionState} selection
 * @param {string} blockKey
 * @return {Draft.Model.ImmutableData.ContentState}
 */
const indentBlock = (
  contentState: Draft.ContentState,
  selection: Draft.SelectionState,
  blockKey: string,
): Draft.ContentState => {
  const rangeToInsert = <Draft.SelectionState>selection.merge({
    focusKey: blockKey,
    focusOffset: 0,
    anchorKey: blockKey,
    anchorOffset: 0,
  });

  return Modifier.insertText(contentState, rangeToInsert, detectIndentation());
};
