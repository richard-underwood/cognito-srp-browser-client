import {
  HASH_TYPE,
  arrayToBase64,
  arrayToHexString,
  base64ToArray,
  hexStringToArray,
  padHex,
  stringToArray,
} from './util';
import { infoBits } from './constants';

export class Session {
  private hkdf: Uint8Array;
  private key: Uint8Array;

  constructor(poolname: string, username: string, key: Uint8Array, scramblingParameter: Uint8Array);
  constructor(poolname: string, username: string, hkdf: string);
  constructor(
    private poolname: string,
    private username: string,
    keyOrHkdf: Uint8Array | string,
    private scramblingParameter?: Uint8Array,
  ) {
    if (keyOrHkdf instanceof Uint8Array) {
      this.key = keyOrHkdf;
    } else {
      this.hkdf = hexStringToArray(keyOrHkdf);
    }
  }

  async calculateSignature(secretBlock: string, timestamp: string) {
    const poolArray = stringToArray(this.poolname);
    const userArray = stringToArray(this.username);
    const secretArray = base64ToArray(secretBlock);
    const timestampArray = stringToArray(timestamp);
    const dataArray = new Uint8Array(
      poolArray.length + userArray.length + secretArray.length + timestampArray.length,
    );
    dataArray.set(poolArray, 0);
    dataArray.set(userArray, poolArray.length);
    dataArray.set(secretArray, poolArray.length + userArray.length);
    dataArray.set(timestampArray, poolArray.length + userArray.length + secretArray.length);

    if (!this.hkdf) {
      this.hkdf = await this.calculateHkdf();
    }

    const hmacKey = await crypto.subtle.importKey(
      'raw',
      this.hkdf,
      { name: 'HMAC', hash: HASH_TYPE },
      true,
      ['sign'],
    );

    const hash = new Uint8Array(await crypto.subtle.sign('HMAC', hmacKey, dataArray));

    return arrayToBase64(hash);
  }

  async getHkdf() {
    if (!this.hkdf) {
      this.hkdf = await this.calculateHkdf();
    }

    return arrayToHexString(this.hkdf);
  }

  private async calculateHkdf() {
    if (!this.scramblingParameter) {
      throw new Error('No scrambing parameter set');
    }

    const scramblingKey = await crypto.subtle.importKey(
      'raw',
      hexStringToArray(padHex(this.scramblingParameter)),
      { name: 'HMAC', hash: HASH_TYPE },
      true,
      ['sign'],
    );

    const prk = new Uint8Array(
      await crypto.subtle.sign('HMAC', scramblingKey, hexStringToArray(padHex(this.key))),
    );

    const prkKey = await crypto.subtle.importKey(
      'raw',
      prk,
      { name: 'HMAC', hash: HASH_TYPE },
      true,
      ['sign'],
    );

    const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', prkKey, stringToArray(infoBits)));

    return hmac.slice(0, 16);
  }
}
