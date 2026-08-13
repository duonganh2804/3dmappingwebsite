/**
 * Script to update coordinates and calibration offsets for the Quy Nhon project.
 * Run with: npx tsx update_quynhon_coords.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const PROJECT_ID = '0261fee6-221e-49c9-b23c-196746f37dd6';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/webgis?schema=public'
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`🚀 Starting update for Quy Nhon project (ID: ${PROJECT_ID})...`);

  // Target coordinates on Google Maps / satellite:
  const newCenterLat = 13.76214708331626;
  const newCenterLon = 109.22203355339238;
  const newEpsg = 32649; // Quy Nhon is in UTM Zone 49N

  // Original absolute positions calibrated by user:
  const calibratedLat = 13.762482;
  const calibratedLon = 109.221727;

  // Calculate new relative offsets (calibrated - newCenter):
  const modelLonOffset = calibratedLon - newCenterLon;
  const modelLatOffset = calibratedLat - newCenterLat;

  console.log(`📍 New Center Lon: ${newCenterLon}`);
  console.log(`📍 New Center Lat: ${newCenterLat}`);
  console.log(`📍 EPSG Code: ${newEpsg}`);
  console.log(`📍 Calculated relative Lon offset: ${modelLonOffset}`);
  console.log(`📍 Calculated relative Lat offset: ${modelLatOffset}`);

  const newCalibration = {
    modelLon: modelLonOffset,
    modelLat: modelLatOffset,
    modelHeight: 0.3,
    modelHeading: 0,
    domLon: modelLonOffset,
    domLat: modelLatOffset,
    domScale: 1.0,
    domHeading: 0,
    pcLon: modelLonOffset,
    pcLat: modelLatOffset,
    pcHeight: 0,
    pcHeading: 0
  };

  const calibrationString = JSON.stringify(newCalibration);
  console.log(`🔧 New calibration payload: ${calibrationString}`);

  try {
    const updatedProject = await prisma.project.update({
      where: { id: PROJECT_ID },
      data: {
        centerLon: newCenterLon,
        centerLat: newCenterLat,
        epsg: newEpsg,
        calibration: calibrationString
      }
    });

    console.log('✅ Quy Nhon project coordinates and calibration updated successfully!');
    console.log(JSON.stringify(updatedProject, null, 2));
  } catch (err: any) {
    console.error('❌ Error updating database:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
