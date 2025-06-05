import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const cookies = req.headers.get('cookie');
  console.log('Raw cookies:', cookies);
  console.log('All headers:', Object.fromEntries(req.headers.entries()));
  
  const session = await getServerSession({
    req,
    ...authOptions,
  });
  console.log('Session:', session);
  console.log('Session user:', session?.user);
  console.log('Session email:', session?.user?.email);

  if (!session?.user?.email) {
    console.log('No session or email found');
    return NextResponse.json({ 
      error: 'Unauthorized',
      debug: {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasEmail: !!session?.user?.email,
        receivedCookies: cookies
      }
    }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      birthday: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    console.log('User not found for email:', session.user.email);
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(req: Request) {
  const session = await getServerSession({ req, ...authOptions });

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    
    const updated = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: data.name,
        avatarUrl: data.avatarUrl,
        birthday: data.birthday ? new Date(data.birthday) : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        birthday: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}