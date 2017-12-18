import * as Draft from 'draft-js';

import { getCurrentBlock } from './utils/getCurrentBlock';

/**
 * Return true if selection is inside a code block
 *
 * @param {Draft.EditorState} editorState
 * @return {Boolean}
 */
export const hasSelectionInBlock = (editorState: Draft.EditorState): boolean =>
  getCurrentBlock(editorState).getType() === 'code-block';
