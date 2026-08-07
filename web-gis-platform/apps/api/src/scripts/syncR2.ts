import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/webgis?schema=public'
});
const prisma = new PrismaClient({ adapter });

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
  },
  forcePathStyle: true
});

async function run() {
  try {
    const PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-1d5704adea5c46b3920fd8f19e3c3480.r2.dev';
    
    let isTruncated = true;
    let continuationToken: string | undefined;
    const projectIds = new Set<string>();
    const allKeys: string[] = [];

    console.log('Fetching files from R2...');

    while (isTruncated) {
      const cmd = new ListObjectsV2Command({ 
        Bucket: 'webgis-assets', 
        Prefix: 'projects/',
        ContinuationToken: continuationToken
      });
      const res = await r2Client.send(cmd);
      
      if (res.Contents) {
        res.Contents.forEach(c => {
          allKeys.push(c.Key!);
          const parts = c.Key!.split('/');
          if (parts.length >= 2) {
            projectIds.add(parts[1]);
          }
        });
      }
      
      isTruncated = res.IsTruncated || false;
      continuationToken = res.NextContinuationToken;
    }

    console.log(`Found ${allKeys.length} files in total across ${projectIds.size} projects.`);
    console.log('Projects:', Array.from(projectIds));

    const adminUser = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } });

    for (const pid of projectIds) {
      const domUrl = allKeys.includes(`projects/${pid}/dom.png`) ? `${PUBLIC_URL}/projects/${pid}/dom.png` : null;
      const modelUrl = allKeys.includes(`projects/${pid}/model.glb`) ? `${PUBLIC_URL}/projects/${pid}/model.glb` : null;
      const metadataUrl = allKeys.includes(`projects/${pid}/metadata.json`) ? `${PUBLIC_URL}/projects/${pid}/metadata.json` : null;
      const pointCloudUrl = allKeys.includes(`projects/${pid}/pointcloud/tileset.json`) ? `${PUBLIC_URL}/projects/${pid}/pointcloud/tileset.json` 
                            : allKeys.includes(`projects/${pid}/pointcloud/index.json`) ? `${PUBLIC_URL}/projects/${pid}/pointcloud/index.json`
                            : allKeys.includes(`projects/${pid}/pointcloud/cloud.copc.laz`) ? `${PUBLIC_URL}/projects/${pid}/pointcloud/cloud.copc.laz` : null;

      let p = await prisma.project.findUnique({ where: { id: pid } });
      if (!p) {
        let centerLat = 21.0285;
        let centerLon = 105.8542;
        let epsg = 32648;
        let name = `Dự án khôi phục ${pid}`;

        if (metadataUrl) {
            try {
                const metadataResponse = await fetch(metadataUrl);
                if (metadataResponse.ok) {
                    const metadata = await metadataResponse.json();
                    if (metadata.center) {
                        centerLat = metadata.center[1];
                        centerLon = metadata.center[0];
                    }
                    if (metadata.epsg) {
                        epsg = metadata.epsg;
                    }
                }
            } catch (e) {}
        }

        console.log(`Creating project ${pid}...`);
        await prisma.project.create({
          data: {
            id: pid,
            name: name,
            description: "Được khôi phục tự động từ R2",
            centerLat,
            centerLon,
            epsg,
            domUrl,
            metadataUrl,
            modelUrl,
            pointCloudId: pointCloudUrl,
            isPublic: true,
            createdById: adminUser?.id
          }
        });
      } else {
        console.log(`Project ${pid} already exists. Updating URLs...`);
        await prisma.project.update({
          where: { id: pid },
          data: {
            domUrl,
            metadataUrl,
            modelUrl,
            pointCloudId: pointCloudUrl,
            isPublic: true
          }
        });
      }
    }
    console.log('Sync complete!');
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
