import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import { getInitialUserCredits } from "./videoConfig";

const providers = [
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : []),
  CredentialsProvider({
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email?.toLowerCase().trim();
      const password = credentials?.password;
      if (!email || !password) return null;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash) return null;

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        credits: user.credits,
        role: user.role,
      };
    },
  }),
];

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  providers,
  callbacks: {
    async signIn({ user }) {
      if (user?.email && process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL) {
        await prisma.user.update({
          where: { email: user.email },
          data: { role: "admin" },
        }).catch(() => null);
      }
      return true;
    },
    async jwt({ token, user }) {
      const email = user?.email || token.email;
      if (email) {
        const dbUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true, credits: true, role: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.credits = dbUser.credits;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.credits = token.credits ?? 0;
        session.user.role = token.role || "user";
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      const initialCredits = getInitialUserCredits();
      const role = user.email && process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL ? "admin" : "user";
      await prisma.user.update({
        where: { id: user.id },
        data: { role, credits: initialCredits },
      });
      await prisma.creditEvent.create({
        data: {
          userId: user.id,
          amount: initialCredits,
          action: "signup_bonus",
          note: "Free starter credits",
          metadata: {
            environment: process.env.NODE_ENV || "development",
          },
        },
      });
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
