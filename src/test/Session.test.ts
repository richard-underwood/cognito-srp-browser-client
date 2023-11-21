import { Session } from '../lib/index';
import { hexStringToArray } from '../lib/util';
import { poolname, clientUser, sessionKey, scramblingParameter, hkdf } from './constants';

describe('Session', () => {
  it('should be constructable from session key and scrambling parameter', async () => {
    const session = new Session(
      poolname,
      clientUser.username,
      hexStringToArray(sessionKey),
      hexStringToArray(scramblingParameter),
    );
    expect(await session.getHkdf()).toMatchSnapshot();
    expect(await session.calculateSignature('secret', 'timestamp')).toMatchSnapshot();
  });

  it('should be constructable from hkdf', async () => {
    const session = new Session(poolname, clientUser.username, hkdf);
    expect(await session.getHkdf()).toMatchSnapshot();
    expect(await session.calculateSignature('secret', 'timestamp')).toMatchSnapshot();
  });
});
