import { getPublicKey, utils } from '@noble/secp256k1';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

export type Identity = {
  privateKeyHex: string; // 64 hex chars
  publicKeyHex: string;  // 66 hex (compressed) or 130 hex (uncompressed)
};

export function createIdentity(): Identity {
  const privBytes = utils.randomPrivateKey();
  const privateKeyHex = bytesToHex(privBytes);
  const pubBytes = getPublicKey(privBytes, true /* compressed */);
  const publicKeyHex = bytesToHex(pubBytes);
  return { privateKeyHex, publicKeyHex };
}

export function publicKeyFromPrivate(privateKeyHex: string): string {
  const priv = hexToBytes(privateKeyHex);
  const pub = getPublicKey(priv, true);
  return bytesToHex(pub);
}
