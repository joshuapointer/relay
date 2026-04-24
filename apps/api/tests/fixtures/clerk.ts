import { SignJWT, generateKeyPair, exportJWK, type KeyLike } from 'jose';

interface KeyPair {
  privateKey: KeyLike;
  publicKey: KeyLike;
  kid: string;
}

let keyPairPromise: Promise<KeyPair> | null = null;

function getKeyPair(): Promise<KeyPair> {
  if (!keyPairPromise) {
    keyPairPromise = generateKeyPair('RS256').then(({ privateKey, publicKey }) => ({
      privateKey,
      publicKey,
      kid: 'test-key-1',
    }));
  }
  return keyPairPromise;
}

export interface ClerkJwtPayload {
  userId: string;
  email: string;
  displayName?: string;
}

export interface SignClerkJwtOptions {
  expiresIn?: string;
  issuer?: string;
}

export async function signClerkJwt(
  payload: ClerkJwtPayload,
  opts: SignClerkJwtOptions = {}
): Promise<string> {
  const { privateKey, kid } = await getKeyPair();
  const { expiresIn = '1h', issuer = 'https://clerk.test.local' } = opts;

  return new SignJWT({
    sub: payload.userId,
    email: payload.email,
    ...(payload.displayName ? { name: payload.displayName } : {}),
  })
    .setProtectedHeader({ alg: 'RS256', kid })
    .setIssuedAt()
    .setIssuer(issuer)
    .setExpirationTime(expiresIn)
    .sign(privateKey);
}

export async function jwksStub(): Promise<{ keys: object[] }> {
  const { publicKey, kid } = await getKeyPair();
  const jwk = await exportJWK(publicKey);
  return {
    keys: [{ ...jwk, kid, use: 'sig', alg: 'RS256' }],
  };
}

/** Returns the fixture's public key — used by the auth plugin in mock mode. */
export async function getMockPublicKey(): Promise<KeyLike> {
  const { publicKey } = await getKeyPair();
  return publicKey;
}

/**
 * Resets the cached keypair (useful between test runs if needed).
 */
export function resetKeyPair(): void {
  keyPairPromise = null;
}
