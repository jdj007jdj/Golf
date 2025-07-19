/**
 * Script to clean up database and add Silver Lakes Golf Course
 * This will remove all games, shots, rounds, and courses
 * Then add Silver Lakes Golf Course with proper hole data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...');
  
  try {
    // Delete in order of dependencies
    console.log('Deleting game scores...');
    await prisma.gameScore.deleteMany({});
    
    console.log('Deleting games...');
    await prisma.game.deleteMany({});
    
    console.log('Deleting shots...');
    await prisma.shot.deleteMany({});
    
    console.log('Deleting round participants...');
    await prisma.roundParticipant.deleteMany({});
    
    console.log('Deleting rounds...');
    await prisma.round.deleteMany({});
    
    console.log('Deleting hole tees...');
    await prisma.holeTee.deleteMany({});
    
    console.log('Deleting holes...');
    await prisma.hole.deleteMany({});
    
    console.log('Deleting tee boxes...');
    await prisma.teeBox.deleteMany({});
    
    console.log('Deleting courses...');
    await prisma.course.deleteMany({});
    
    console.log('✅ Database cleaned successfully!');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  }
}

async function addSilverLakesCourse() {
  console.log('🏌️ Adding Silver Lakes Golf Course...');
  
  try {
    // Create the course
    const course = await prisma.course.create({
      data: {
        name: 'Silver Lakes Golf Estate',
        address: '1 Silverlakes Blvd, Silver Lakes Golf Estate',
        city: 'Pretoria',
        state: 'Gauteng',
        country: 'South Africa',
        postalCode: '0081',
        phone: '+27 12 809 0281',
        website: 'https://www.silverlakes.co.za',
        teeBoxes: {
          create: [
            {
              name: 'Black',
              color: '#000000',
              rating: 74.5,
              slope: 140,
              totalYards: 7075,
            },
            {
              name: 'Blue',
              color: '#0000FF',
              rating: 72.5,
              slope: 135,
              totalYards: 6625,
            },
            {
              name: 'White',
              color: '#FFFFFF',
              rating: 70.5,
              slope: 130,
              totalYards: 6150,
            },
            {
              name: 'Red',
              color: '#FF0000',
              rating: 68.5,
              slope: 125,
              totalYards: 5350,
            }
          ]
        }
      },
      include: {
        teeBoxes: true
      }
    });
    
    console.log(`✅ Created course: ${course.name}`);
    
    // Silver Lakes hole data (Par and distances from different tees)
    const holes = [
      { number: 1, par: 4, handicap: 9, black: 430, blue: 405, white: 375, red: 325 },
      { number: 2, par: 4, handicap: 3, black: 440, blue: 410, white: 380, red: 330 },
      { number: 3, par: 3, handicap: 15, black: 195, blue: 175, white: 155, red: 135 },
      { number: 4, par: 5, handicap: 11, black: 560, blue: 530, white: 490, red: 430 },
      { number: 5, par: 4, handicap: 5, black: 455, blue: 425, white: 395, red: 340 },
      { number: 6, par: 4, handicap: 1, black: 470, blue: 440, white: 410, red: 350 },
      { number: 7, par: 3, handicap: 17, black: 210, blue: 185, white: 160, red: 140 },
      { number: 8, par: 5, handicap: 13, black: 580, blue: 545, white: 505, red: 445 },
      { number: 9, par: 4, handicap: 7, black: 420, blue: 395, white: 365, red: 315 },
      { number: 10, par: 4, handicap: 8, black: 425, blue: 400, white: 370, red: 320 },
      { number: 11, par: 3, handicap: 18, black: 185, blue: 165, white: 145, red: 125 },
      { number: 12, par: 5, handicap: 12, black: 555, blue: 525, white: 485, red: 425 },
      { number: 13, par: 4, handicap: 2, black: 465, blue: 435, white: 405, red: 345 },
      { number: 14, par: 4, handicap: 10, black: 435, blue: 405, white: 375, red: 325 },
      { number: 15, par: 3, handicap: 16, black: 200, blue: 180, white: 160, red: 140 },
      { number: 16, par: 5, handicap: 14, black: 570, blue: 540, white: 500, red: 440 },
      { number: 17, par: 4, handicap: 4, black: 450, blue: 420, white: 390, red: 335 },
      { number: 18, par: 4, handicap: 6, black: 445, blue: 415, white: 385, red: 330 }
    ];
    
    // Get tee boxes for the course
    const teeBoxes = await prisma.teeBox.findMany({
      where: { courseId: course.id }
    });
    
    const blackTee = teeBoxes.find(t => t.name === 'Black')!;
    const blueTee = teeBoxes.find(t => t.name === 'Blue')!;
    const whiteTee = teeBoxes.find(t => t.name === 'White')!;
    const redTee = teeBoxes.find(t => t.name === 'Red')!;
    
    // Create holes with tee distances
    for (const holeData of holes) {
      const hole = await prisma.hole.create({
        data: {
          courseId: course.id,
          holeNumber: holeData.number,
          par: holeData.par,
          handicapIndex: holeData.handicap,
          holeTees: {
            create: [
              {
                teeBoxId: blackTee.id,
                distanceYards: holeData.black
              },
              {
                teeBoxId: blueTee.id,
                distanceYards: holeData.blue
              },
              {
                teeBoxId: whiteTee.id,
                distanceYards: holeData.white
              },
              {
                teeBoxId: redTee.id,
                distanceYards: holeData.red
              }
            ]
          }
        }
      });
      
      console.log(`  ✅ Created hole ${hole.holeNumber} (Par ${hole.par})`);
    }
    
    console.log('\n🎉 Silver Lakes Golf Estate added successfully!');
    console.log(`   Course ID: ${course.id}`);
    console.log(`   Location: ${course.city}, ${course.country}`);
    console.log(`   Tee Boxes: ${teeBoxes.length}`);
    console.log(`   Holes: ${holes.length}`);
    
    return course;
  } catch (error) {
    console.error('❌ Error adding Silver Lakes:', error);
    throw error;
  }
}

async function main() {
  try {
    // First cleanup
    await cleanupDatabase();
    
    // Then add Silver Lakes
    await addSilverLakesCourse();
    
    console.log('\n✅ All operations completed successfully!');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();