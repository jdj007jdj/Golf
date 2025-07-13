import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test data...');

  // Create test user
  const passwordHash = await bcrypt.hash('test123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      username: 'testuser2',
      passwordHash,
      firstName: 'Test',
      lastName: 'User',
      handicap: 15.5,
    },
  });

  console.log('Created user:', user.username);

  // Create a test course with 18 holes
  const course = await prisma.course.create({
    data: {
      name: 'Pine Valley Golf Club',
      address: '123 Golf Course Road',
      city: 'Pine Valley',
      state: 'NJ',
      country: 'USA',
      postalCode: '08021',
      phone: '(555) 123-4567',
      website: 'www.pinevalleygolf.com',
      createdBy: user.id,
      holes: {
        create: [
          // Front 9
          { holeNumber: 1, par: 4, handicapIndex: 5 },
          { holeNumber: 2, par: 5, handicapIndex: 1 },
          { holeNumber: 3, par: 3, handicapIndex: 15 },
          { holeNumber: 4, par: 4, handicapIndex: 7 },
          { holeNumber: 5, par: 4, handicapIndex: 11 },
          { holeNumber: 6, par: 3, handicapIndex: 17 },
          { holeNumber: 7, par: 5, handicapIndex: 3 },
          { holeNumber: 8, par: 4, handicapIndex: 9 },
          { holeNumber: 9, par: 4, handicapIndex: 13 },
          // Back 9
          { holeNumber: 10, par: 4, handicapIndex: 6 },
          { holeNumber: 11, par: 4, handicapIndex: 4 },
          { holeNumber: 12, par: 3, handicapIndex: 16 },
          { holeNumber: 13, par: 5, handicapIndex: 2 },
          { holeNumber: 14, par: 4, handicapIndex: 10 },
          { holeNumber: 15, par: 4, handicapIndex: 8 },
          { holeNumber: 16, par: 3, handicapIndex: 18 },
          { holeNumber: 17, par: 5, handicapIndex: 12 },
          { holeNumber: 18, par: 4, handicapIndex: 14 },
        ],
      },
      teeBoxes: {
        create: [
          { name: 'Championship', color: '#000000', rating: 74.5, slope: 145, totalYards: 7200 },
          { name: 'Blue', color: '#0066CC', rating: 72.3, slope: 138, totalYards: 6800 },
          { name: 'White', color: '#FFFFFF', rating: 70.1, slope: 130, totalYards: 6400 },
          { name: 'Gold', color: '#FFD700', rating: 68.0, slope: 125, totalYards: 6000 },
          { name: 'Red', color: '#CC0000', rating: 65.5, slope: 118, totalYards: 5400 },
        ],
      },
    },
    include: {
      holes: true,
      teeBoxes: true,
    },
  });

  console.log('Created course:', course.name);

  // Create hole distances for each tee box
  const holeDistances = [
    // Hole 1 - Par 4
    { hole: 1, championship: 425, blue: 410, white: 385, gold: 365, red: 340 },
    // Hole 2 - Par 5
    { hole: 2, championship: 580, blue: 555, white: 530, gold: 505, red: 475 },
    // Hole 3 - Par 3
    { hole: 3, championship: 185, blue: 170, white: 155, gold: 140, red: 125 },
    // Hole 4 - Par 4
    { hole: 4, championship: 450, blue: 430, white: 405, gold: 380, red: 355 },
    // Hole 5 - Par 4
    { hole: 5, championship: 390, blue: 375, white: 360, gold: 345, red: 320 },
    // Hole 6 - Par 3
    { hole: 6, championship: 210, blue: 195, white: 175, gold: 160, red: 140 },
    // Hole 7 - Par 5
    { hole: 7, championship: 600, blue: 575, white: 545, gold: 515, red: 480 },
    // Hole 8 - Par 4
    { hole: 8, championship: 415, blue: 395, white: 375, gold: 355, red: 330 },
    // Hole 9 - Par 4
    { hole: 9, championship: 440, blue: 420, white: 395, gold: 370, red: 345 },
    // Hole 10 - Par 4
    { hole: 10, championship: 435, blue: 415, white: 390, gold: 365, red: 340 },
    // Hole 11 - Par 4
    { hole: 11, championship: 460, blue: 440, white: 415, gold: 390, red: 360 },
    // Hole 12 - Par 3
    { hole: 12, championship: 175, blue: 160, white: 145, gold: 130, red: 115 },
    // Hole 13 - Par 5
    { hole: 13, championship: 590, blue: 565, white: 535, gold: 505, red: 470 },
    // Hole 14 - Par 4
    { hole: 14, championship: 400, blue: 380, white: 360, gold: 340, red: 315 },
    // Hole 15 - Par 4
    { hole: 15, championship: 445, blue: 425, white: 400, gold: 375, red: 350 },
    // Hole 16 - Par 3
    { hole: 16, championship: 195, blue: 180, white: 165, gold: 150, red: 130 },
    // Hole 17 - Par 5
    { hole: 17, championship: 570, blue: 545, white: 520, gold: 495, red: 465 },
    // Hole 18 - Par 4
    { hole: 18, championship: 455, blue: 435, white: 410, gold: 385, red: 355 },
  ];

  // Create HoleTee records
  for (const holeData of holeDistances) {
    const hole = course.holes.find(h => h.holeNumber === holeData.hole);
    if (!hole) continue;

    for (const teeBox of course.teeBoxes) {
      let distance = 0;
      switch (teeBox.name.toLowerCase()) {
        case 'championship':
          distance = holeData.championship;
          break;
        case 'blue':
          distance = holeData.blue;
          break;
        case 'white':
          distance = holeData.white;
          break;
        case 'gold':
          distance = holeData.gold;
          break;
        case 'red':
          distance = holeData.red;
          break;
      }

      if (distance > 0) {
        await prisma.holeTee.create({
          data: {
            holeId: hole.id,
            teeBoxId: teeBox.id,
            distanceYards: distance,
          },
        });
      }
    }
  }

  console.log('Created hole distances for all tee boxes');

  // Create another course without distances (for testing)
  const simpleCourse = await prisma.course.create({
    data: {
      name: 'Riverside Municipal Golf Course',
      city: 'Riverside',
      state: 'CA',
      country: 'USA',
      createdBy: user.id,
      holes: {
        create: Array.from({ length: 18 }, (_, i) => ({
          holeNumber: i + 1,
          par: [4, 5, 3, 4, 4, 3, 5, 4, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4][i],
          handicapIndex: i + 1,
        })),
      },
      teeBoxes: {
        create: [
          { name: 'Blue', color: '#0066CC', rating: 70.5, slope: 125 },
          { name: 'White', color: '#FFFFFF', rating: 68.5, slope: 120 },
          { name: 'Red', color: '#CC0000', rating: 66.0, slope: 115 },
        ],
      },
    },
  });

  console.log('Created simple course:', simpleCourse.name);

  console.log('Test data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });