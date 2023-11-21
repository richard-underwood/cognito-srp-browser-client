import { BigInteger } from './BigInteger';
import { ClientUser } from './UserPool';

export const HASH_TYPE = 'SHA-256';

export async function getHashString(data: Uint8Array | string) {
  const dataArray = data instanceof Uint8Array ? data : stringToArray(data);
  const hash = new Uint8Array(await crypto.subtle.digest(HASH_TYPE, dataArray));
  return arrayToHexString(hash).padStart(64, '0');
}

export function padHex(data: string | Uint8Array) {
  const hex = data instanceof Uint8Array ? arrayToHexString(data) : data;

  if (hex.length % 2) {
    return '0' + hex;
  } else if ('89ABCDEFabcdef'.includes(hex[0])) {
    return '00' + hex;
  } else {
    return hex;
  }
}

export function randomBytes(size = 32): Uint8Array {
  const data = new Uint8Array(size);
  crypto.getRandomValues(data);
  return data;
}

export async function calculateScramblingParameter(A: Uint8Array, B: Uint8Array) {
  const paddedA = hexStringToArray(padHex(A));
  const paddedB = hexStringToArray(padHex(B));

  const dataArray = new Uint8Array(paddedA.length + paddedB.length);
  dataArray.set(paddedA, 0);
  dataArray.set(paddedB, paddedA.length);

  const hash = new Uint8Array(await crypto.subtle.digest(HASH_TYPE, dataArray));

  return BigInteger.fromArray(hash);
}

export async function calculatePrivateKey(poolname: string, user: ClientUser, salt: string) {
  const hash = await getHashString(`${poolname}${user.username}:${user.password}`);
  const array = hexStringToArray(padHex(salt) + hash);
  return new BigInteger(await getHashString(array), 16);
}

export function getBigInteger(data: string | Uint8Array) {
  if (data instanceof Uint8Array) {
    return BigInteger.fromArray(data);
  } else {
    return new BigInteger(data, 16);
  }
}

export function arrayToHexString(data: Uint8Array): string {
  return Array.from(data)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function stringToArray(data: string): Uint8Array {
  const array = new Uint8Array(data.length);
  for (let n = 0; n < data.length; n++) {
    array[n] = data.charCodeAt(n);
  }
  return array;
}

export function hexStringToArray(data: string) {
  if (data.length % 2) {
    data = '0' + data;
  }
  const array = new Uint8Array(data.length / 2);
  for (let n = 0; n < data.length; n += 2) {
    const v = parseInt(data.substring(n, n + 2), 16);
    if (isNaN(v)) {
      throw new Error('Invalid value in hex string: ' + data.substring(n, 2));
    } else {
      array[n / 2] = v;
    }
  }
  return array;
}

export function base64ToArray(data: string): Uint8Array {
  return stringToArray(atob(data.replace(/\-/g, '+').replace(/_/g, '/')));
}

export function arrayToBase64(data: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, data));
}
