import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import type { JWT } from "next-auth/jwt";
import type { Account, Session } from "next-auth";

const scopes = [
  "user-read-email",
  "playlist-read-private",
  "playlist-modify-private",
  "playlist-modify-public",
  "user-library-read",
  "user-read-playback-state",
  "user-modify-playback-state"
].join(",");

const authOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID || "",
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
      authorization: {
        url: "https://accounts.spotify.com/authorize",
        params: { 
          scope: scopes,
          redirect_uri: "http://127.0.0.1:3000/api/auth/callback/spotify"
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }: { token: JWT; account?: Account | null }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expires_at = account.expires_at;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.expires_at = token.expires_at;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
