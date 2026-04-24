/**
 * NextAuth (v4) configuration for Authentik OIDC.
 *
 * The provider issues RS256-signed JWTs that are also accepted by the Relay
 * API (which validates against the Authentik JWKS). We expose the raw
 * Authentik access_token on the session so client/server callers can pass it
 * to the API as a bearer token.
 */
import type { NextAuthOptions } from 'next-auth';
import AuthentikProvider from 'next-auth/providers/authentik';

const issuer = process.env.AUTHENTIK_ISSUER ?? '';
const clientId = process.env.AUTHENTIK_CLIENT_ID ?? '';
const clientSecret = process.env.AUTHENTIK_CLIENT_SECRET ?? '';

export const authOptions: NextAuthOptions = {
  providers: [
    AuthentikProvider({
      clientId,
      clientSecret,
      issuer,
      authorization: { params: { scope: 'openid profile email' } },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account }) {
      // First sign-in: persist the Authentik access_token on the JWT so the
      // client can authenticate to the Relay API.
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      if (account?.expires_at) {
        token.accessTokenExpires = account.expires_at * 1000;
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.accessToken === 'string') {
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
  },
};
