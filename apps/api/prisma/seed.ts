/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user1 = await prisma.user.create({
    data: {
      name: 'Alice',
      email: 'alice@example.com',
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

  console.log('Seeded:', user1.name, user2.name);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
