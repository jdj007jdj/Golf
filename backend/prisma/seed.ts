import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create test user
  const passwordHash = await bcrypt.hash('password123', 12);
  const testUser = await prisma.user.create({
    data: {
      email: 'test@golf.com',
      username: 'testuser',
      passwordHash,
      firstName: 'Test',
      lastName: 'User',
      preferences: {
        units: 'imperial',
        defaultTeeBox: 'white',
        autoGPS: true,
        shareData: true,
        notifications: {
          roundReminders: true,
          friendRequests: true,
          achievements: true,
        },
      },
    },
  });

  console.log(`Created test user: ${testUser.email}`);

  // Create sample courses with tee boxes
  const courses = await Promise.all([
    prisma.course.create({
      data: {
        name: 'Pebble Beach Golf Links',
        city: 'Pebble Beach',
        state: 'CA',
        country: 'USA',
        teeBoxes: {
          create: [
            { name: 'Black', color: '#000000' },
            { name: 'Blue', color: '#0066CC' },
            { name: 'White', color: '#FFFFFF' },
            { name: 'Gold', color: '#FFD700' },
            { name: 'Red', color: '#CC0000' },
          ],
        },
        holes: {
          create: [
            { holeNumber: 1, par: 4 },
            { holeNumber: 2, par: 5 },
            { holeNumber: 3, par: 4 },
            { holeNumber: 4, par: 4 },
            { holeNumber: 5, par: 3 },
            { holeNumber: 6, par: 5 },
            { holeNumber: 7, par: 3 },
            { holeNumber: 8, par: 4 },
            { holeNumber: 9, par: 4 },
            { holeNumber: 10, par: 4 },
            { holeNumber: 11, par: 4 },
            { holeNumber: 12, par: 3 },
            { holeNumber: 13, par: 4 },
            { holeNumber: 14, par: 5 },
            { holeNumber: 15, par: 4 },
            { holeNumber: 16, par: 4 },
            { holeNumber: 17, par: 3 },
            { holeNumber: 18, par: 5 },
          ],
        },
      },
    }),
    prisma.course.create({
      data: {
        name: 'Augusta National Golf Club',
        city: 'Augusta',
        state: 'GA',
        country: 'USA',
        teeBoxes: {
          create: [
            { name: 'Black', color: '#000000' },
            { name: 'Blue', color: '#0066CC' },
            { name: 'White', color: '#FFFFFF' },
            { name: 'Gold', color: '#FFD700' },
            { name: 'Red', color: '#CC0000' },
          ],
        },
        holes: {
          create: [
            { holeNumber: 1, par: 4 },
            { holeNumber: 2, par: 5 },
            { holeNumber: 3, par: 4 },
            { holeNumber: 4, par: 3 },
            { holeNumber: 5, par: 4 },
            { holeNumber: 6, par: 3 },
            { holeNumber: 7, par: 4 },
            { holeNumber: 8, par: 5 },
            { holeNumber: 9, par: 4 },
            { holeNumber: 10, par: 4 },
            { holeNumber: 11, par: 4 },
            { holeNumber: 12, par: 3 },
            { holeNumber: 13, par: 5 },
            { holeNumber: 14, par: 4 },
            { holeNumber: 15, par: 5 },
            { holeNumber: 16, par: 3 },
            { holeNumber: 17, par: 4 },
            { holeNumber: 18, par: 4 },
          ],
        },
      },
    }),
    prisma.course.create({
      data: {
        name: 'St. Andrews Links - Old Course',
        city: 'St. Andrews',
        state: 'Fife',
        country: 'Scotland',
        teeBoxes: {
          create: [
            { name: 'Black', color: '#000000' },
            { name: 'Blue', color: '#0066CC' },
            { name: 'White', color: '#FFFFFF' },
            { name: 'Gold', color: '#FFD700' },
            { name: 'Red', color: '#CC0000' },
          ],
        },
        holes: {
          create: [
            { holeNumber: 1, par: 4 },
            { holeNumber: 2, par: 4 },
            { holeNumber: 3, par: 4 },
            { holeNumber: 4, par: 4 },
            { holeNumber: 5, par: 5 },
            { holeNumber: 6, par: 4 },
            { holeNumber: 7, par: 4 },
            { holeNumber: 8, par: 3 },
            { holeNumber: 9, par: 4 },
            { holeNumber: 10, par: 4 },
            { holeNumber: 11, par: 3 },
            { holeNumber: 12, par: 4 },
            { holeNumber: 13, par: 4 },
            { holeNumber: 14, par: 5 },
            { holeNumber: 15, par: 4 },
            { holeNumber: 16, par: 4 },
            { holeNumber: 17, par: 4 },
            { holeNumber: 18, par: 4 },
          ],
        },
      },
    }),
  ]);

  console.log(`Created ${courses.length} courses with holes`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });