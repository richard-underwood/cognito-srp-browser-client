import { UserPool } from '../lib/index';
import { arrayToHexString } from '../lib/util';
import { poolname, clientUser } from './constants';
import { UserPool as UserPool_S } from 'cognito-srp';

describe('integration', () => {
  it('works together', async () => {
    const userPool = new UserPool(poolname);
    const userPool_s = new UserPool_S(poolname);

    const serverUser = await userPool.createUser(clientUser);
    const client = await userPool.getClientChallenge(clientUser);
    const server = await userPool_s.getServerChallenge(serverUser);

    const A = arrayToHexString(client.calculateA());
    const B = server.calculateB().toString('hex');

    const clientSignature = await (
      await client.getSession(B, serverUser.salt)
    ).calculateSignature('secret', 'timestamp');

    const serverSignature = server.getSession(A).calculateSignature('secret', 'timestamp');

    expect(clientSignature).toEqual(serverSignature);
  });
});
