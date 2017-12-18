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
        ? 'move-selection-to-start-of-text'
        : null;
    default:
      return null;
  }
};
