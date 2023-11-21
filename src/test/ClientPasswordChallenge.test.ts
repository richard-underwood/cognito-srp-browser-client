import { ClientPasswordChallenge } from '../lib/index';
import { clientUser, secret, poolname, publicKey, salt } from './constants';

describe('ClientPasswordChallenge', () => {
  let challenge: ClientPasswordChallenge;

  beforeAll(() => {
    challenge = new ClientPasswordChallenge(poolname, clientUser, secret);
  });

  it('should calculate A', () => {
    const A = challenge.calculateA();
    expect(A).toMatchSnapshot();
  });

  it('should get a session', async () => {
    const session = await challenge.getSession(publicKey, salt);
    expect(await session.getHkdf()).toMatchSnapshot();
  });
});
