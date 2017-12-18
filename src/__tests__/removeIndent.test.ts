import { calibrateOffset } from '../utils/removeIndent';

describe('calibrateOffset', () => {
  it('should return 1st argument if 2nd lower than 1', () => {
    expect(calibrateOffset(1, 0, 2)).toBe(1);
    expect(calibrateOffset(1, -1, 2)).toBe(1);
    expect(calibrateOffset(1, 1, 2)).not.toBe(1);
  });

  it('should return 1st arg if 1st and 3rd args are lower than 2nd', () => {
    expect(calibrateOffset(1, 4, 2)).toBe(1);
  });

  it('should return zero if 1st arg is lower than 2nd, but 3rd is bigger or equal than 2nd', () => {
    expect(calibrateOffset(1, 2, 4)).toBe(0);
    expect(calibrateOffset(1, 4, 4)).toBe(0);
  });

  describe('1st arg bigger than 2nd', () => {
    it('should return difference between 1st and 3rd args if 2nd is bigger or equal to 1st', () => {
      const first = 4;
      const second = 3;
      const third = 2;
      expect(calibrateOffset(first, second, third)).toBe(first - third);

      const secondTwo = 3;
      const thirdTwo = 3;
      expect(calibrateOffset(first, secondTwo, thirdTwo)).toBe(
        first - thirdTwo,
      );
    });

    it('should return difference between 1st and 2nd args if 2nd is lower than 3rd', () => {
      const first = 4;
      const second = 2;
      const third = 3;
      expect(calibrateOffset(first, second, third)).toBe(first - second);
    });
  });
});
