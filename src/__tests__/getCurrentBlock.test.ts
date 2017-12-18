import * as Draft from 'draft-js';

import { getCurrentBlock } from '../utils/getCurrentBlock';
import { createWithText, initialText } from './utils';

it('should return ContentBlock', () => {
  const editorState = createWithText(initialText);
  expect(getCurrentBlock(editorState)).toBeInstanceOf(Draft.ContentBlock);
});
