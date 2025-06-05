import { PrismaClient } from '@prisma/client';
import { compare } from 'bcrypt';
import { SignJWT } from 'jose';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();
const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 });

  const valid = await compare(password, user.passwordHash);
  if (!valid) return NextResponse.json({ error: 'Invalid password' }, { status: 401 });

  const token = await new SignJWT({ id: user.id, name: user.name, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);

  return NextResponse.json({ token });
}
