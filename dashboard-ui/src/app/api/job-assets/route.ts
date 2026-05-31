import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

function buildPublicUrl(bucket: string, region: string, key: string) {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key.replace(/^\/+/, '')}`;
}

function inferStage(key: string) {
  const normalized = key.toLowerCase();
  if (normalized.includes('/final')) return 'compress';
  if (normalized.includes('/watermark')) return 'watermark';
  if (normalized.includes('/filter')) return 'filter';
  if (normalized.includes('/resize')) return 'resize';
  return 'startPipeline';
}

async function probeUrl(url: string) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

function buildCandidates(bucket: string, region: string, jobId: string) {
  const stageNames = ['resize', 'filter', 'watermarked', 'final'];
  const extensions = ['webp', 'jpg', 'jpeg', 'png'];

  const keys = stageNames.flatMap((stageName) =>
    extensions.map((extension) => `processed/${jobId}/${stageName}.${extension}`)
  );

  return keys.map((key) => ({
    key,
    stage: inferStage(key),
    url: buildPublicUrl(bucket, region, key),
  }));
}

export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ success: false, error: 'jobId is required' }, { status: 400 });
    }

    // Support S3_BUCKET values that may include a prefix, e.g. "bucket-name/uploads"
    const rawBucket = process.env.S3_BUCKET || 'image-pipeline-bucket-prod-108836621838';
    const region = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
    const [bucketName, ...rest] = rawBucket.split('/');
    const basePrefix = rest.join('/');

      const responsePrefix = `${basePrefix ? basePrefix.replace(/^\/+|\/+$/g, '') + '/' : ''}processed/${jobId}/`;

    // If AWS credentials are available, prefer listing the S3 prefix and returning signed URLs
    const hasAwsCreds = !!(
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    );

    if (hasAwsCreds) {
      const client = new S3Client({ region });
      const prefix = `${basePrefix ? `${basePrefix.replace(/^\/+|\/+$/g, '') + '/'} ` : ''}processed/${jobId}/`.replace(/\s+/g, '');
      const cmd = new ListObjectsV2Command({ Bucket: bucketName, Prefix: prefix });
      const resp = await client.send(cmd);
      const contents = resp.Contents || [];

      // dynamically import presigner at runtime to avoid build-time bundling errors
      let getSignedUrl:
        | ((client: S3Client, command: GetObjectCommand, options: { expiresIn: number }) => Promise<string>)
        | null = null;
      try {
        ({ getSignedUrl } = await import('@aws-sdk/s3-request-presigner'));
      } catch (err: unknown) {
        // If presigner isn't installed in this environment, fall back to public URLs.
        // This avoids a 500 and allows local debugging; note: these URLs will fail for private buckets.
        console.warn('presigner not available, falling back to public S3 URLs:', String(err));
      }

      const items = await Promise.all(
        contents.map(async (c) => {
          const key = c.Key || '';
          let url: string;
          if (getSignedUrl) {
            url = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucketName, Key: key }), {
              expiresIn: 60 * 60,
            });
          } else {
            url = buildPublicUrl(bucketName, region, key);
          }
          return {
            key,
            stage: inferStage(key),
            size: c.Size || 0,
            lastModified: c.LastModified ? c.LastModified.toISOString() : null,
            url,
          };
        })
      );

      const sorted = items.sort((a, b) => a.key.localeCompare(b.key));

      return NextResponse.json({
        success: true,
        jobId,
        bucket: rawBucket,
        prefix: responsePrefix,
        count: sorted.length,
        items: sorted,
      });
    }

    // Fallback: probe public URLs (works when the bucket or objects are public)
    const candidates = buildCandidates(bucketName, region, jobId);
    const found = [] as Array<{ key: string; stage: string; size: number; lastModified: string | null; url: string }>;

    for (const candidate of candidates) {
      if (await probeUrl(candidate.url)) {
        found.push({
          key: candidate.key,
          stage: candidate.stage,
          size: 0,
          lastModified: null,
          url: candidate.url,
        });
      }
    }

    const items = found.sort((left, right) => left.key.localeCompare(right.key));

    return NextResponse.json({
      success: true,
      jobId,
      bucket: rawBucket,
      prefix: responsePrefix,
      count: items.length,
      items,
    });
  } catch (error: unknown) {
    // Log error to server console for easier debugging
    console.error('job-assets error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list job assets',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
