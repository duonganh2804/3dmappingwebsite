import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const filePath = path.resolve(
  __dirname,
  '../../../web/src/assets/Video 3D Mapping nhà máy nhiệt điện Long Phú v1.mp4'
);

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
  },
  forcePathStyle: true
});

async function upload() {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at path: ${filePath}`);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(filePath);
  const fileSize = fs.statSync(filePath).size;
  const fileName = path.basename(filePath);
  const destinationKey = `videos/${fileName}`;

  console.log(`Starting upload: ${fileName} (${(fileSize / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`Uploading to R2 bucket: "${process.env.R2_BUCKET_NAME}" as "${destinationKey}"`);

  try {
    const uploadParallel = new Upload({
      client: r2Client,
      params: {
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: destinationKey,
        Body: fileStream,
        ContentType: 'video/mp4'
      },
      queueSize: 4, // 4 concurrent parts
      partSize: 1024 * 1024 * 5, // 5 MB parts
      leavePartsOnError: false
    });

    uploadParallel.on('httpUploadProgress', (progress) => {
      if (progress.loaded && progress.total) {
        const percent = ((progress.loaded / progress.total) * 100).toFixed(2);
        console.log(`Progress: ${percent}% (${(progress.loaded / (1024 * 1024)).toFixed(2)} MB uploaded)`);
      }
    });

    const result = await uploadParallel.done();
    console.log('\nUpload successfully completed!');
    
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${destinationKey}`;
    console.log(`File is publicly available at: ${publicUrl}`);
    
    // Safety check: delete the file from assets to prevent Vite crashes
    console.log('\nCleaning up local file from assets directory to prevent Vite HMR server crash...');
    fs.unlinkSync(filePath);
    console.log('Cleanup complete. Vite dev server can run cleanly now!');
    
  } catch (error) {
    console.error('Upload failed with error:', error);
    process.exit(1);
  }
}

upload();
