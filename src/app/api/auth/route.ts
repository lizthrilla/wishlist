import { PrismaClient } from '@prisma/client';
import { hash, compare } from 'bcrypt';
import { NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, name } = body;
  const isSignup = !!name;

  if (!email || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (isSignup && !name) {
    return NextResponse.json({ error: 'Name is required for signup' }, { status: 400 });
  }

  try {
    if (isSignup) {
      // Handle signup
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ error: 'User already exists' }, { status: 409 });
      }

      const passwordHash = await hash(password, 10);
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          avatarUrl: '/Avatar.svg', // Set default avatar
        },
      });

      return NextResponse.json(
        { message: 'User created successfully' },
        { status: 201 }
      );
    } else {
      // Handle login
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const isValid = await compare(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const token = sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = NextResponse.json(
        { message: 'Login successful' },
        { status: 200 }
      );

      // Set the JWT token in an HTTP-only cookie
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });

      return response;
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 