import { parseCookieHeader } from './auth.utils';

describe('auth.utils', () => {
  it('ignores malformed cookie values instead of throwing', () => {
    expect(() => parseCookieHeader('good=value; broken=%')).not.toThrow();
    expect(parseCookieHeader('good=value; broken=%')).toEqual({
      good: 'value',
    });
  });
});
