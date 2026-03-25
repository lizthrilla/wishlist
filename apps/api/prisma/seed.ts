/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaClient } from '@prisma/client';
import { randomBytes, scryptSync } from 'node:crypto';

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const user1 = await prisma.user.create({
    data: {
      name: 'Alice',
      email: 'alice@example.com',
      passwordHash: hashPassword('password123'),
      wishlists: {
        create: {
          title: 'Birthday Wishlist',
          items: {
            create: [
              { name: 'Kindle', price: 120 },
              { name: 'Running Shoes', price: 85 },
              { name: 'Board Game', price: 40 },
            ],
          },
        },
      },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Bob',
      email: 'bob@example.com',
      passwordHash: hashPassword('password123'),
      wishlists: {
        create: {
          title: 'Holiday Wishlist',
          items: {
            create: [
              { name: 'Headphones', price: 200 },
              { name: 'Backpack', price: 60 },
            ],
          },
        },
      },
    },
  });

  await prisma.family.create({
    data: {
      name: 'Tiller Family',
      joinCode: 'FAMILY1',
      creatorId: user1.id,
      memberships: {
        create: [{ userId: user1.id }, { userId: user2.id }],
      },
    },
  });

  console.log('Seeded:', user1.name, user2.name);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
