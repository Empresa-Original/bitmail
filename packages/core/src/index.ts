export type Message = {
  id: string;
  from: string;
  to: string[];
  subject?: string;
  body: string;
  createdAt: number;
};

export { createIdentity, publicKeyFromPrivate } from './identity';
export type { Identity } from './identity';

export function version() {
  return '0.1.0';
}
