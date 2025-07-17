/**
 * Script to clear all shots from the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllShots() {
  try {
    console.log('🗑️  Starting to clear all shots from database...');
    
    // Delete all shots
    const deletedShots = await prisma.shot.deleteMany({});
    console.log(`✅ Deleted ${deletedShots.count} shots`);
    
    // Also clear any orphaned round participants if needed
    const roundParticipants = await prisma.roundParticipant.findMany({
      include: {
        shots: true
      }
    });
    
    console.log(`📊 Found ${roundParticipants.length} round participants`);
    
    // Clear course features that might have been created
    const deletedFeatures = await prisma.courseFeature.deleteMany({});
    console.log(`✅ Deleted ${deletedFeatures.count} course features`);
    
    // Clear pin positions
    const deletedPins = await prisma.pinPosition.deleteMany({});
    console.log(`✅ Deleted ${deletedPins.count} pin positions`);
    
    console.log('🎉 Database cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error clearing shots:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllShots();