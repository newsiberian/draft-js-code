import { getKeyBinding } from '../getKeyBinding';

const evt = {};

describe('HOME binding', () => {
  beforeAll(() => {
    evt.keyCode = 36;
  });

  it('should return command', () => {
    evt.ctrlKey = false;
    expect(getKeyBinding(evt)).toBe('selection-to-start-of-text');
  });

  it('should return null if ctrl modifier pressed', () => {
    evt.ctrlKey = true;
    expect(getKeyBinding(evt)).toBeNull();
  });
});

describe('other bindings', () => {
  it('should return null for not recognized keyCodes', () => {
    evt.keyCode = 10;
    expect(getKeyBinding(evt)).toBeNull();
  });
});
