import * as React from 'react';

type SyntheticKeyboardEvent = React.KeyboardEvent<{}>;

/**
 * Return command for a keyboard event
 *
 * @param {SyntheticKeyboardEvent} e
 * @return {String}
 */
export const getKeyBinding = (e: SyntheticKeyboardEvent): any => {};
