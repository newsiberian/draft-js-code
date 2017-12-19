import { BlockMapBuilder, EditorState, Modifier } from 'draft-js';

import * as Immutable from 'immutable';

import { createNewBlock } from './createNewBlock';
import { mergeBlockMap } from './mergeBlockMap';

/**
 * Duplicate selected blocks entirely or selected range
 * @param {Draft.Model.ImmutableData.EditorState} editorState
 * @return {Draft.Model.ImmutableData.EditorState}
 */
export default (editorState: EditorState): EditorState => {
  const contentState = editorState.getCurrentContent();
  const selection = editorState.getSelection();
  const startKey = selection.getStartKey();

  // if collapsed then just copy all block, if not, copy selected text right after
  // focusOffset
  if (selection.isCollapsed()) {
    const currentBlock = contentState.getBlockForKey(startKey);
    const copiedBlock = createNewBlock(currentBlock, currentBlock.getText());
    const newBlockMap = BlockMapBuilder.createFromArray([
      currentBlock,
      copiedBlock,
    ]);
    const mergedBlockMap = mergeBlockMap(
      contentState,
      currentBlock,
      newBlockMap,
    );

    const focusOffset = selection.getFocusOffset();
    const key = copiedBlock.getKey();
    const mergedContent = <Draft.ContentState>contentState.merge({
      blockMap: mergedBlockMap,
      selectionBefore: selection,
      selectionAfter: selection.merge({
        anchorKey: key,
        anchorOffset: focusOffset,
        focusKey: key,
        focusOffset: focusOffset,
      }),
    });

    return EditorState.push(editorState, mergedContent, 'insert-fragment');
  }

  // second case if selection are wide
  // We copy all selected text 'as is' and insert it right after selection end.
  // Selection direction doesn't play any role here
  const endKey = selection.getEndKey();
  const endOffset = selection.getEndOffset();

  const fragment = getFragment(contentState, selection, startKey, endKey);

  const modifiedContent = Modifier.replaceWithFragment(
    contentState,
    <Draft.SelectionState>selection.merge({
      anchorKey: endKey,
      anchorOffset: endOffset,
      focusKey: endKey,
      focusOffset: endOffset,
      isBackward: false,
    }),
    fragment,
  );

  return EditorState.push(editorState, modifiedContent, 'insert-fragment');
};

// taken from  draft-js/src/model/transaction/getContentStateFragment.js
const getFragment = (
  contentState: Draft.ContentState,
  selection: Draft.SelectionState,
  startKey: string,
  endKey: string,
): Immutable.OrderedMap<string, Draft.ContentBlock> => {
  const startOffset = selection.getStartOffset();
  const endOffset = selection.getEndOffset();

  const blockMap = contentState.getBlockMap();
  const blockKeys = blockMap.keySeq();
  const startIndex = blockKeys.indexOf(startKey);
  const endIndex = blockKeys.indexOf(endKey) + 1;

  return blockMap.slice(startIndex, endIndex).map((block, blockKey) => {
    const text = block.getText();
    const chars = block.getCharacterList();

    if (startKey === endKey) {
      return block.merge({
        text: text.slice(startOffset, endOffset),
        characterList: chars.slice(startOffset, endOffset),
      });
    }

    if (blockKey === startKey) {
      return block.merge({
        text: text.slice(startOffset),
        characterList: chars.slice(startOffset),
      });
    }

    if (blockKey === endKey) {
      return block.merge({
        text: text.slice(0, endOffset),
        characterList: chars.slice(0, endOffset),
      });
    }

    return block;
  });
};
