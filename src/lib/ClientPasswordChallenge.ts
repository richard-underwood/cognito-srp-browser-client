import { ClientUser } from './UserPool';
import { BigInteger } from './BigInteger';
import {
  getBigInteger,
  calculateScramblingParameter,
  calculatePrivateKey,
  hexStringToArray,
  arrayToHexString,
} from './util';
import { g, N, Nbytes, getMultiplierParameter } from './constants';
import { Session } from './Session';

export class ClientPasswordChallenge {
  private a: BigInteger;
  private A: Uint8Array;

  constructor(
    public poolname: string,
    public user: ClientUser,
    a: string | Uint8Array,
  ) {
    this.a = getBigInteger(a);
  }

  calculateA() {
    if (!this.A) {
      this.A = g.modPow(this.a, N).toArray(Nbytes);
    }
    return this.A;
  }

  getAString() {
    return arrayToHexString(this.calculateA());
  }

  async getSession(B: string, salt: string, username?: string) {
    const multiplierParameter = await getMultiplierParameter();
    const Bint = new BigInteger(B, 16);

    if (username) {
      this.user.username = username;
    }

    if (Bint.compareTo(BigInteger.ZERO) <= 0 || Bint.compareTo(N) >= 0) {
      throw new Error('A should be between 0 and N exclusive');
    }

    const privateKey = await calculatePrivateKey(this.poolname, this.user, salt);

    const scramblingParameter = await calculateScramblingParameter(
      this.calculateA(),
      hexStringToArray(B),
    );

    const sessionKey = Bint.subtract(multiplierParameter.multiply(g.modPow(privateKey, N)))
      .modPow(this.a.add(scramblingParameter.multiply(privateKey)), N)
      .mod(N)
      .toArray(Nbytes);

    return new Session(
      this.poolname,
      this.user.username,
      sessionKey,
      scramblingParameter.toArray(),
    );
  }
}
