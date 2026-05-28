import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Initialize S3 Client - loads AWS credentials automatically from environment/credentials file
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
    });

    // Handle environment variables safely with a production bucket fallback.
    const rawBucket = process.env.S3_BUCKET || 'image-pipeline-bucket-prod-108836621838';
    const parts = rawBucket.split('/');
    const bucketName = parts[0];
    const prefix = parts.slice(1).join('/');

    // Upload image to the directory in S3 (supporting custom prefix e.g. "uploads" from .env.local)
    const key = prefix ? `${prefix}/${file.name}` : `uploads/${file.name}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    // Debug S3 upload parameters and credentials safely
    let accessKeyId = 'Unknown';
    try {
      const creds = await s3Client.config.credentials();
      accessKeyId = creds?.accessKeyId || 'None';
    } catch (e: any) {
      console.warn('Error reading AWS credentials:', e.message);
    }

    await s3Client.send(command);

    return NextResponse.json({
      success: true,
      bucket: bucketName,
      key: key,
    });
  } catch (error: any) {
    console.error('Error uploading file to S3:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
