import { KeyBindingUtil } from 'draft-js';

import * as React from 'react';

type SyntheticKeyboardEvent = React.KeyboardEvent<{}>;

/**
 * Return command for a keyboard event
 * @param {SyntheticKeyboardEvent} e
 * @return {string | null}
 */
export const getKeyBinding = (e: SyntheticKeyboardEvent): string | null => {
  switch (e.keyCode) {
    case 36: // HOME
      return !KeyBindingUtil.isCtrlKeyCommand(e)
        ? 'selection-to-start-of-text'
        : null;
    case 89: // Y
      return KeyBindingUtil.hasCommandModifier(e) ? 'delete-blocks' : null;
    case 68: // D
      return KeyBindingUtil.hasCommandModifier(e) ? 'duplicate-blocks' : null;
    default:
      return null;
  }
};
