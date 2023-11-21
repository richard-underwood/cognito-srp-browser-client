import { UserPool, ClientPasswordChallenge } from '../lib/index';

import { salt, poolname, clientUser } from './constants';

describe('UserPool', () => {
  let pool: UserPool;

  beforeAll(() => {
    pool = new UserPool(poolname);
  });

  it('should create a user', async () => {
    const user = await pool.createUser(clientUser, salt);
    expect(user).toMatchSnapshot();
  });

  it('should provide client challenges', async () => {
    const challenge = await pool.getClientChallenge(clientUser);
    expect(challenge).toBeInstanceOf(ClientPasswordChallenge);
  });
});
