import * as Draft from 'draft-js';
import * as Immutable from 'immutable';

export type BlockMap = Immutable.OrderedMap<string, Draft.ContentBlock>;

/**
 * @param {Draft.Model.ImmutableData.ContentState} contentState
 * @param {string} startKey
 * @param {string} endKey
 * @return {Draft.Model.ImmutableData.ContentBlock[]} selected blocks, read: 'lines'
 */
export const getSelectedBlocks = (
  contentState: Draft.ContentState,
  startKey: string,
  endKey: string,
): BlockMap => {
  let state = false;
  let endPassed = false;

  return <BlockMap>contentState.getBlockMap().filter((value, key) => {
    if (endPassed) {
      return false;
    } else if (key === startKey) {
      state = true;
    } else if (key === endKey) {
      endPassed = true;
    }
    return state;
  });
};
