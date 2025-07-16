// src/lib/auth/authOptions.ts
import { NextAuthOptions, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";
import { Account, Profile, Session } from "next-auth";
import { AdapterUser } from "next-auth/adapters";
import { loginWithGoogle } from "@/lib/firebase/services";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({
      token,
      account,
      profile,
      user,
    }: {
      token: JWT;
      account?: Account | null;
      profile?: Profile;
      user: User | AdapterUser;
    }) {
      if (account?.provider === "google") {
        const data = {
          fullname: user.name ?? "",
          email: user.email ?? "",
          role: "member",
          type: "google",
          image: (profile as { picture?: string })?.picture ?? "",
        };

        await loginWithGoogle(data, (result) => {
          if (result.status) {
            token.email = result.data.email;
            token.fullname = result.data.fullname;
            token.role = result.data.role;
            token.picture = result.data.image;
          }
        });
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.fullname as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
