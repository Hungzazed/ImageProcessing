import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url).searchParams.get('url');
    if (!url) return NextResponse.json({ success: false, error: 'Missing url' }, { status: 400 });

    let res = await fetch(url, { method: 'HEAD' });

    if (!res.ok) {
      // S3 presigned URLs signed for GET will reject HEAD requests with 403. Fallback to GET.
      res = await fetch(url, { method: 'GET' });
    }

    if (!res.ok) {
      return NextResponse.json({ success: false, status: res.status }, { status: 502 });
    }

    const length = res.headers.get('content-length');
    const type = res.headers.get('content-type');

    // Safely cancel the body stream since we only need the headers
    if (res.body) {
      try {
        await res.body.cancel();
      } catch (err) {
        // Ignore stream cancellation error
      }
    }

    return NextResponse.json({ success: true, length: length ? parseInt(length, 10) : null, type });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
