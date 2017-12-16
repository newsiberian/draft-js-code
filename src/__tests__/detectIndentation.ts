import { EditorState, ContentState, SelectionState } from 'draft-js';

import { detectIndentation } from '../utils/detectIndentation';
import {
  createSelection,
  insertIndentsBeforeText,
  initialText,
  toPlainText,
  createWithText,
} from './utils';

it('should not take into account empty lines with indentations', () => {
  const oneIndentWithoutText = '  ';
});
