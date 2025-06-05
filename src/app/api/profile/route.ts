import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface AnniversaryData {
  id?: string;
  label: string;
  date: string;
  isPrimary: boolean;
}

interface WishlistLinkData {
  id?: string;
  label: string;
  url: string;
}

export async function GET(req: Request) {
  console.log('GET /api/profile - Cookies:', req.headers.get('cookie'));
  console.log('GET /api/profile - Headers:', Object.fromEntries(req.headers.entries()));

  const session = await getServerSession(authOptions);
  console.log('GET /api/profile - Session:', session);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      birthday: true,
      anniversaries: {
        select: {
          id: true,
          label: true,
          date: true,
          isPrimary: true,
        },
      },
      wishlistLinks: {
        select: {
          id: true,
          label: true,
          url: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    birthday: user.birthday,
    anniversaries: user.anniversaries,
    wishlistLinks: user.wishlistLinks,
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const { name, birthday, anniversaries, wishlistLinks } = data;

  try {
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        birthday: birthday ? new Date(birthday) : null,
        anniversaries: {
          upsert: anniversaries.map((anniversary: AnniversaryData) => ({
            where: { id: anniversary.id || 'new' },
            create: {
              label: anniversary.label,
              date: new Date(anniversary.date),
              isPrimary: anniversary.isPrimary,
            },
            update: {
              label: anniversary.label,
              date: new Date(anniversary.date),
              isPrimary: anniversary.isPrimary,
            },
          })),
        },
        wishlistLinks: {
          upsert: wishlistLinks.map((link: WishlistLinkData) => ({
            where: { id: link.id || 'new' },
            create: {
              label: link.label,
              url: link.url,
            },
            update: {
              label: link.label,
              url: link.url,
            },
          })),
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        birthday: true,
        anniversaries: {
          select: {
            id: true,
            label: true,
            date: true,
            isPrimary: true,
          },
        },
        wishlistLinks: {
          select: {
            id: true,
            label: true,
            url: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      birthday: user.birthday,
      anniversaries: user.anniversaries,
      wishlistLinks: user.wishlistLinks,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}