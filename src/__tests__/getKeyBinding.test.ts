import { getKeyBinding } from '../getKeyBinding';

it('should return nothing', () => {
  expect(getKeyBinding()).toBeUndefined();
});
