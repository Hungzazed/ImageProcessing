import { NextRequest, NextResponse } from 'next/server';
import { getProdGatewayBaseUrl } from '@/utils/gatewayUrls';

function shouldForwardAuthorization(targetUrl: string, authHeader: string | null) {
  if (!authHeader) return false;

  try {
    const host = new URL(targetUrl).hostname;
    const isAwsEndpoint = host.endsWith('.amazonaws.com');
    const isSigV4 = /^AWS4-HMAC-SHA256\s/i.test(authHeader);

    // AWS endpoints configured for IAM require SigV4 auth format.
    if (isAwsEndpoint && !isSigV4) {
      return false;
    }
  } catch {
    // If URL parsing fails, keep existing behavior and forward header.
  }

  return true;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(request, await params);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(request, await params);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(request, await params);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(request, await params);
}

async function handleProxyRequest(request: NextRequest, params: { path: string[] }) {
  try {
    const { path } = params;
    const searchParams = request.nextUrl.searchParams.toString();
    
    // Construct the remote target URL pointing to AWS API Gateway prod stage
    const targetUrl = `${getProdGatewayBaseUrl()}/${path.join('/')}${searchParams ? '?' + searchParams : ''}`;
    
    const method = request.method;
    const authHeader = request.headers.get('authorization');
    const contentType = request.headers.get('content-type') || '';

    // Prepare headers to forward
    const headers: Record<string, string> = {};
    if (shouldForwardAuthorization(targetUrl, authHeader)) {
      headers['Authorization'] = authHeader;
    }
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    // Prepare request init options
    const initOptions: RequestInit = {
      method,
      headers,
    };

    // Forward request body if method is not GET or HEAD
    if (method !== 'GET' && method !== 'HEAD') {
      if (contentType.includes('application/json')) {
        const bodyText = await request.text();
        initOptions.body = bodyText;
      } else if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        initOptions.body = formData;
      } else {
        const bodyText = await request.text();
        initOptions.body = bodyText;
      }
    }

    const response = await fetch(targetUrl, initOptions);

    const responseContentType = response.headers.get('content-type') || '';
    let payload: unknown;

    if (responseContentType.includes('application/json')) {
      payload = await response.json();
    } else {
      payload = await response.text();
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (error: unknown) {
    console.error('[NextProxy] Gateway error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gateway Proxy failed to reach remote service',
      },
      { status: 500 }
    );
  }
}
