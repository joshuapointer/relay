import { jwtVerify, createRemoteJWKSet, type JWTPayload } from 'jose';

export interface VerifiedAuth {
  clerkId: string;
  email: string;
  displayName?: string;
}

export interface VerifierOptions {
  mockMode: boolean;
  /** Local public key resolver (mock mode). Can be a KeyLike or JWK set. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  localPublicKey?: any;
  /** Clerk JWKS URL (live mode); defaults to Clerk's public JWKS. */
  jwksUrl?: string | undefined;
  issuer?: string | undefined;
  audience?: string | undefined;
}

/**
 * Verifies a JWT and returns normalized auth claims.
 * In mock mode, uses the locally-provided public key.
 * In live mode, resolves keys via a remote JWKS.
 */
export async function verifyJwt(
  token: string,
  opts: VerifierOptions
): Promise<VerifiedAuth> {
  if (!token) throw new AuthError('Missing bearer token');

  let payload: JWTPayload;
  const verifyOpts: Parameters<typeof jwtVerify>[2] = {
    algorithms: ['RS256'],
    clockTolerance: '5s',
  };
  if (opts.issuer) verifyOpts.issuer = opts.issuer;
  if (opts.audience) verifyOpts.audience = opts.audience;

  if (opts.mockMode) {
    if (!opts.localPublicKey) {
      throw new AuthError('Mock verifier missing public key');
    }
    const verified = await jwtVerify(token, opts.localPublicKey, verifyOpts);
    payload = verified.payload;
  } else {
    if (!opts.jwksUrl) throw new AuthError('Live verifier missing JWKS url');
    const jwks = createRemoteJWKSet(new URL(opts.jwksUrl));
    const verified = await jwtVerify(token, jwks, verifyOpts);
    payload = verified.payload;
  }

  const clerkId = (payload.sub ?? '') as string;
  const email = ((payload as Record<string, unknown>)['email'] ?? '') as string;
  const displayName = (payload as Record<string, unknown>)['name'] as string | undefined;

  if (!clerkId) throw new AuthError('Token missing sub');
  if (!email) throw new AuthError('Token missing email');
  return { clerkId, email, ...(displayName ? { displayName } : {}) };
}

export class AuthError extends Error {
  public readonly code = 'UNAUTHENTICATED';
  constructor(message: string) {
    super(message);
  }
}
