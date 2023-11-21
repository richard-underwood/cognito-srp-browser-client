import { calculatePrivateKey, randomBytes, arrayToHexString } from './util';
import { N, Nbytes, g } from './constants';
import { ClientPasswordChallenge } from './ClientPasswordChallenge';

export interface ServerUser {
  username: string;
  salt: string;
  verifier: string;
}

export interface ClientUser {
  username: string;
  password: string;
}

export class UserPool {
  constructor(private poolname: string) {}

  async createUser(user: ClientUser, salt?: string): Promise<ServerUser> {
    if (!salt) {
      salt = arrayToHexString(randomBytes(16));
    }

    const privateKey = await calculatePrivateKey(this.poolname, user, salt);

    const verifier = arrayToHexString(g.modPow(privateKey, N).toArray(Nbytes));

    return { username: user.username, salt, verifier };
  }

  async getClientChallenge(user: ClientUser) {
    const a = randomBytes();
    return new ClientPasswordChallenge(this.poolname, user, a);
  }
}
