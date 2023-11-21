import { BigInteger as _BigInteger } from 'jsbn';
import { arrayToHexString, hexStringToArray } from './util';

declare module 'jsbn' {
  export interface BigInteger {
    toArray(length?: number): Uint8Array;
  }
}

_BigInteger.prototype.toArray = function (length?: number) {
  let str = this.toString(16);

  if (length) {
    str = str.padStart(length * 2, '0');
  } else if (str.length % 2) {
    str = '0' + str;
  }

  return hexStringToArray(str);
};

export class BigInteger extends _BigInteger {
  static fromArray(array: Uint8Array) {
    return new BigInteger(arrayToHexString(array), 16);
  }
}
