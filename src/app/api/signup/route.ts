import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, name } = body;

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: 'User already exists' }, { status: 409 });
  }

  const passwordHash = await hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
    },
  });

  return NextResponse.json({ message: 'User created', user: { id: user.id, email: user.email } }, { status: 201 });
}
