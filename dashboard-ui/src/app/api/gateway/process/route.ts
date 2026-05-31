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

export async function GET(request: NextRequest) {
	return handleProxyRequest(request);
}

export async function POST(request: NextRequest) {
	return handleProxyRequest(request);
}

export async function PUT(request: NextRequest) {
	return handleProxyRequest(request);
}

export async function DELETE(request: NextRequest) {
	return handleProxyRequest(request);
}

async function handleProxyRequest(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams.toString();
		const targetUrl = `${getProdGatewayBaseUrl()}/process${searchParams ? '?' + searchParams : ''}`;

		const method = request.method;
		const authHeader = request.headers.get('authorization');
		const contentType = request.headers.get('content-type') || '';

		const headers: Record<string, string> = {};
		if (authHeader && shouldForwardAuthorization(targetUrl, authHeader)) {
			headers['Authorization'] = authHeader;
		}
		if (contentType) {
			headers['Content-Type'] = contentType;
		}

		const initOptions: RequestInit = {
			method,
			headers,
		};

		if (method !== 'GET' && method !== 'HEAD') {
			if (contentType.includes('application/json')) {
				initOptions.body = await request.text();
			} else if (contentType.includes('multipart/form-data')) {
				initOptions.body = await request.formData();
			} else {
				initOptions.body = await request.text();
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
		console.error('[NextProxy] Gateway process error:', error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Gateway Process proxy failed to reach remote service',
			},
			{ status: 500 }
		);
	}
}
