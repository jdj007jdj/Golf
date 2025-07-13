import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper function to generate random scores based on handicap
function generateScore(par: number, handicap: number, holeHandicap: number): number {
  const baseScore = par;
  const handicapStrokes = handicap <= holeHandicap ? 1 : 0;
  const variance = Math.random() * 3 - 1; // -1 to +2 variance
  return Math.max(1, Math.round(baseScore + handicapStrokes + variance));
}

// Helper function to generate putts based on score
function generatePutts(score: number, par: number): number {
  if (score <= par - 2) return Math.random() < 0.7 ? 1 : 2; // Eagles usually 1-2 putts
  if (score <= par - 1) return Math.random() < 0.8 ? 2 : 1; // Birdies usually 2 putts
  if (score === par) return Math.random() < 0.6 ? 2 : 3;     // Pars usually 2-3 putts
  return Math.random() < 0.5 ? 3 : (Math.random() < 0.8 ? 4 : 5); // Bogeys+ usually 3-5 putts
}

// Helper function to generate random date in the past
function randomPastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
}

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
      handicap: 15.2,
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

  // Create sample courses with detailed hole information
  console.log('Creating Pebble Beach Golf Links...');
  const pebbleBeach = await
prisma.course.create({
      data: {
        name: 'Pebble Beach Golf Links',
        address: '1700 17 Mile Dr',
        city: 'Pebble Beach',
        state: 'CA',
        country: 'USA',
        postalCode: '93953',
        phone: '+1 831-624-3811',
        website: 'https://www.pebblebeach.com',
        location: 'POINT(-121.9492 36.5681)',
        timezone: 'America/Los_Angeles',
        isVerified: true,
      },
    });

  // Create tee boxes for Pebble Beach
  const pebbleBeachTees = await Promise.all([
    prisma.teeBox.create({
      data: {
        courseId: pebbleBeach.id,
        name: 'Black (Tips)',
        color: '#000000',
        rating: 75.1,
        slope: 145,
        totalYards: 6828,
      },
    }),
    prisma.teeBox.create({
      data: {
        courseId: pebbleBeach.id,
        name: 'Blue',
        color: '#0066CC',
        rating: 72.9,
        slope: 142,
        totalYards: 6325,
      },
    }),
    prisma.teeBox.create({
      data: {
        courseId: pebbleBeach.id,
        name: 'White',
        color: '#FFFFFF',
        rating: 70.1,
        slope: 135,
        totalYards: 5672,
      },
    }),
    prisma.teeBox.create({
      data: {
        courseId: pebbleBeach.id,
        name: 'Gold',
        color: '#FFD700',
        rating: 67.8,
        slope: 125,
        totalYards: 5021,
      },
    }),
  ]);

  // Create holes for Pebble Beach with detailed information
  const pebbleBeachHoles = await Promise.all([
    prisma.hole.create({ data: { courseId: pebbleBeach.id, holeNumber: 1, par: 4, handicapIndex: 11 } }),
    prisma.hole.create({ data: { courseId: pebbleBeach.id, holeNumber: 2, par: 5, handicapIndex: 15 } }),
    prisma.hole.create({ data: { courseId: pebbleBeach.id, holeNumber: 3, par: 4, handicapIndex: 7 } }),
    prisma.hole.create({ data: { courseId: pebbleBeach.id, holeNumber: 4, par: 4, handicapIndex: 5 } }),
    prisma.hole.create({ data: { courseId: pebbleBeach.id, holeNumber: 5, par: 3, handicapIndex: 17 } }),
    prisma.hole.create({ data: { courseId: pebbleBeach.id, holeNumber: 6, par: 5, handicapIndex: 3 } }),
    prisma.hole.create({ data: { courseId: pebbleBeach.id, holeNumber: 7, par: 3, handicapIndex: 13 } }),
    prisma.hole.create({ data: { courseId: pebbleBeach.id, holeNumber: 8, par: 4, handicapIndex: 1 } }),
    prisma.hole.create({ data: { courseId: pebbleBeach.id, holeNumber: 9, par: 4, handicapIndex: 9 } }),
    prisma.hole.create({ data: { courseId: pebbleBeach.id, holeNumber: 10, par: 4, handicapIndex: 2 } }),
    prisma.hole.create({ data: { courseId: pebbleBeach.id, holeNumber: 11, par: 4, handicapIndex: 12 } }),
    prisma.hole.create({ data: { courseId: pebbleBeach.id, holeNumber: 12, par: 3, handicapIndex: 18 } }),
    prisma.hole.create({ data: { courseId: pebbleBeach.id, holeNumber: 13, par: 4, handicapIndex: 8 } }),
    prisma.hole.create({ data: { courseId: pebbleBeach.id, holeNumber: 14, par: 5, handicapIndex: 4 } }),
    prisma.hole.create({ data: { courseId: pebbleBeach.id, holeNumber: 15, par: 4, handicapIndex: 10 } }),
    prisma.hole.create({ data: { courseId: pebbleBeach.id, holeNumber: 16, par: 4, handicapIndex: 14 } }),
    prisma.hole.create({ data: { courseId: pebbleBeach.id, holeNumber: 17, par: 3, handicapIndex: 16 } }),
    prisma.hole.create({ data: { courseId: pebbleBeach.id, holeNumber: 18, par: 5, handicapIndex: 6 } }),
  ]);

  // Create hole tees for Pebble Beach White tees (distances in yards)
  const whiteTee = pebbleBeachTees.find(t => t.name === 'White')!;
  const pebbleBeachDistances = [380, 502, 388, 331, 166, 515, 106, 418, 464, 424, 384, 202, 399, 573, 397, 402, 178, 543];
  
  await Promise.all(pebbleBeachHoles.map((hole, index) => 
    prisma.holeTee.create({
      data: {
        holeId: hole.id,
        teeBoxId: whiteTee.id,
        distanceYards: pebbleBeachDistances[index],
      },
    })
  ));

  console.log('Creating Augusta National Golf Club...');
  const augusta =
await prisma.course.create({
      data: {
        name: 'Augusta National Golf Club',
        address: '2604 Washington Rd',
        city: 'Augusta',
        state: 'GA',
        country: 'USA',
        postalCode: '30904',
        phone: '+1 706-667-6000',
        website: 'https://www.masters.com',
        location: 'POINT(-82.0199 33.5028)',
        timezone: 'America/New_York',
        isVerified: true,
      },
    });

  // Create tee boxes for Augusta National
  const augustaTees = await Promise.all([
    prisma.teeBox.create({
      data: {
        courseId: augusta.id,
        name: 'Tournament (Green)',
        color: '#228B22',
        rating: 76.2,
        slope: 137,
        totalYards: 7475,
      },
    }),
    prisma.teeBox.create({
      data: {
        courseId: augusta.id,
        name: 'Member',
        color: '#4169E1',
        rating: 72.1,
        slope: 129,
        totalYards: 6365,
      },
    }),
    prisma.teeBox.create({
      data: {
        courseId: augusta.id,
        name: 'Forward',
        color: '#FFD700',
        rating: 68.9,
        slope: 118,
        totalYards: 5460,
      },
    }),
  ]);

  // Create holes for Augusta National with detailed information
  const augustaHoles = await Promise.all([
    prisma.hole.create({ data: { courseId: augusta.id, holeNumber: 1, par: 4, handicapIndex: 7 } }),
    prisma.hole.create({ data: { courseId: augusta.id, holeNumber: 2, par: 5, handicapIndex: 11 } }),
    prisma.hole.create({ data: { courseId: augusta.id, holeNumber: 3, par: 4, handicapIndex: 13 } }),
    prisma.hole.create({ data: { courseId: augusta.id, holeNumber: 4, par: 3, handicapIndex: 15 } }),
    prisma.hole.create({ data: { courseId: augusta.id, holeNumber: 5, par: 4, handicapIndex: 1 } }),
    prisma.hole.create({ data: { courseId: augusta.id, holeNumber: 6, par: 3, handicapIndex: 17 } }),
    prisma.hole.create({ data: { courseId: augusta.id, holeNumber: 7, par: 4, handicapIndex: 9 } }),
    prisma.hole.create({ data: { courseId: augusta.id, holeNumber: 8, par: 5, handicapIndex: 5 } }),
    prisma.hole.create({ data: { courseId: augusta.id, holeNumber: 9, par: 4, handicapIndex: 3 } }),
    prisma.hole.create({ data: { courseId: augusta.id, holeNumber: 10, par: 4, handicapIndex: 2 } }),
    prisma.hole.create({ data: { courseId: augusta.id, holeNumber: 11, par: 4, handicapIndex: 4 } }),
    prisma.hole.create({ data: { courseId: augusta.id, holeNumber: 12, par: 3, handicapIndex: 16 } }),
    prisma.hole.create({ data: { courseId: augusta.id, holeNumber: 13, par: 5, handicapIndex: 8 } }),
    prisma.hole.create({ data: { courseId: augusta.id, holeNumber: 14, par: 4, handicapIndex: 12 } }),
    prisma.hole.create({ data: { courseId: augusta.id, holeNumber: 15, par: 5, handicapIndex: 6 } }),
    prisma.hole.create({ data: { courseId: augusta.id, holeNumber: 16, par: 3, handicapIndex: 14 } }),
    prisma.hole.create({ data: { courseId: augusta.id, holeNumber: 17, par: 4, handicapIndex: 10 } }),
    prisma.hole.create({ data: { courseId: augusta.id, holeNumber: 18, par: 4, handicapIndex: 18 } }),
  ]);

  // Create hole tees for Augusta National Member tees (distances in yards)
  const memberTee = augustaTees.find(t => t.name === 'Member')!;
  const augustaDistances = [445, 575, 350, 240, 455, 180, 450, 570, 460, 495, 505, 155, 510, 440, 550, 170, 440, 465];
  
  await Promise.all(augustaHoles.map((hole, index) => 
    prisma.holeTee.create({
      data: {
        holeId: hole.id,
        teeBoxId: memberTee.id,
        distanceYards: augustaDistances[index],
      },
    })
  ));

  console.log('Creating historical rounds and scores...');
  
  // Create multiple historical rounds for test user
  const rounds = [];
  
  // Create 10 rounds at Pebble Beach over the past 90 days
  for (let i = 0; i < 10; i++) {
    const roundDate = randomPastDate(90);
    const round = await prisma.round.create({
      data: {
        courseId: pebbleBeach.id,
        teeBoxId: whiteTee.id,
        startedAt: roundDate,
        finishedAt: new Date(roundDate.getTime() + 4.5 * 60 * 60 * 1000), // 4.5 hours later
        weatherConditions: {
          temperature: Math.floor(Math.random() * 20) + 60,
          windSpeed: Math.floor(Math.random() * 15),
          windDirection: 'SW',
          conditions: ['sunny', 'partly cloudy', 'overcast'][Math.floor(Math.random() * 3)],
        },
        walkingRiding: Math.random() > 0.5 ? 'walking' : 'riding',
        roundType: 'casual',
      },
    });

    const participant = await prisma.roundParticipant.create({
      data: {
        roundId: round.id,
        userId: testUser.id,
        teeBoxId: whiteTee.id,
        isScorer: true,
        playingHandicap: 15,
      },
    });

    // Create hole scores for this round
    for (let holeIndex = 0; holeIndex < pebbleBeachHoles.length; holeIndex++) {
      const hole = pebbleBeachHoles[holeIndex];
      const score = generateScore(hole.par, 15, hole.handicapIndex!);
      const putts = generatePutts(score, hole.par);
      
      await prisma.holeScore.create({
        data: {
          roundParticipantId: participant.id,
          holeId: hole.id,
          score,
          putts,
          fairwayHit: hole.par > 3 ? Math.random() > 0.4 : null, // 60% fairway hit rate
          greenInRegulation: Math.random() > 0.5, // 50% GIR
          penalties: Math.random() > 0.85 ? 1 : 0, // 15% penalty rate
          sandSaves: 0,
          upAndDowns: Math.random() > 0.7 ? true : false, // 30% up and down rate
          updatedBy: testUser.id,
        },
      });
    }
    rounds.push(round);
  }
  
  // Create 8 rounds at Augusta National over the past 120 days
  for (let i = 0; i < 8; i++) {
    const roundDate = randomPastDate(120);
    const round = await prisma.round.create({
      data: {
        courseId: augusta.id,
        teeBoxId: memberTee.id,
        startedAt: roundDate,
        finishedAt: new Date(roundDate.getTime() + 4.5 * 60 * 60 * 1000), // 4.5 hours later
        weatherConditions: {
          temperature: Math.floor(Math.random() * 25) + 65,
          windSpeed: Math.floor(Math.random() * 12),
          windDirection: 'E',
          conditions: ['sunny', 'partly cloudy', 'humid'][Math.floor(Math.random() * 3)],
        },
        walkingRiding: 'walking', // Augusta is walking only
        roundType: 'casual',
      },
    });

    const participant = await prisma.roundParticipant.create({
      data: {
        roundId: round.id,
        userId: testUser.id,
        teeBoxId: memberTee.id,
        isScorer: true,
        playingHandicap: 15,
      },
    });

    // Create hole scores for this round at Augusta
    for (let holeIndex = 0; holeIndex < augustaHoles.length; holeIndex++) {
      const hole = augustaHoles[holeIndex];
      const score = generateScore(hole.par, 15, hole.handicapIndex!);
      const putts = generatePutts(score, hole.par);
      
      await prisma.holeScore.create({
        data: {
          roundParticipantId: participant.id,
          holeId: hole.id,
          score,
          putts,
          fairwayHit: hole.par > 3 ? Math.random() > 0.35 : null, // 65% fairway hit rate (Augusta has wide fairways)
          greenInRegulation: Math.random() > 0.6, // 40% GIR (Augusta greens are tough)
          penalties: Math.random() > 0.9 ? 1 : 0, // 10% penalty rate
          sandSaves: 0,
          upAndDowns: Math.random() > 0.75 ? true : false, // 25% up and down rate
          updatedBy: testUser.id,
        },
      });
    }
    rounds.push(round);
  }

  console.log(`Created ${rounds.length} historical rounds with scores`);
  console.log('Database seed completed successfully!');

  // Remove the old code that creates the third course
  /*
  */
}

// Clean up the old Promise.all pattern and function ending
main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });