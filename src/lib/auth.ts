import { type SessionStrategy, type DefaultSession, type Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import { compare } from 'bcrypt';

const prisma = new PrismaClient();

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
}

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: User;
  }
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials:', credentials);
          return null;
        }

        console.log('[AUTH] Attempting login for:', credentials.email);
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        console.log('[AUTH] User found:', !!user);
        if (!user) return null;

        const isValid = await compare(credentials.password, user.passwordHash);
        console.log('[AUTH] Password valid?', isValid);
        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  session: {
    strategy: 'jwt' as SessionStrategy,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: User | null }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}; 