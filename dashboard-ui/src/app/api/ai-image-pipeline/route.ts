import { NextRequest, NextResponse } from 'next/server';
import { getPipelineGatewayBaseUrl } from '@/utils/gatewayUrls';

const DEFAULT_BASE_URL = getPipelineGatewayBaseUrl();

function getBaseUrl() {
  return DEFAULT_BASE_URL.replace(/\/$/, '');
}

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

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing pipeline gateway URL. Set NEXT_PUBLIC_AI_PIPELINE_URL or NEXT_PUBLIC_GATEWAY_URL.',
        },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = {};
    if (shouldForwardAuthorization(baseUrl, authHeader)) {
      headers['Authorization'] = authHeader;
    }

    let operation = '';
    let response: Response;

    if (contentType.includes('application/json')) {
      const body = await request.json();
      operation = String(body.operation || '').trim();

      if (!operation || !['remove-object', 'product-enhance'].includes(operation)) {
        return NextResponse.json(
          { success: false, error: 'operation must be remove-object or product-enhance' },
          { status: 400 }
        );
      }

      headers['Content-Type'] = 'application/json';
      const targetUrl = baseUrl.endsWith('/pipeline')
        ? `${baseUrl}/${operation}`
        : `${baseUrl}/pipeline/${operation}`;
      console.log(`[AI Pipeline Proxy JSON] Forwarding to: ${targetUrl}`);

      const forwardBody = {
        imageUrl: body.imageUrl,
        ...(operation === 'remove-object' ? { prompt: body.prompt } : { backgroundColor: body.backgroundColor }),
        options: body.options,
      };

      response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(forwardBody),
      });
    } else {
      const incomingFormData = await request.formData();
      operation = String(incomingFormData.get('operation') || '').trim();

      if (!operation || !['remove-object', 'product-enhance'].includes(operation)) {
        return NextResponse.json(
          { success: false, error: 'operation must be remove-object or product-enhance' },
          { status: 400 }
        );
      }

      const forwardFormData = new FormData();
      for (const [key, value] of incomingFormData.entries()) {
        if (key === 'operation') continue;

        if (value instanceof File) {
          const arrayBuffer = await value.arrayBuffer();
          const file = new File([arrayBuffer], value.name, { type: value.type });
          forwardFormData.append(key, file);
        } else {
          forwardFormData.append(key, value as FormDataEntryValue);
        }
      }

      const targetUrl = baseUrl.endsWith('/pipeline')
        ? `${baseUrl}/${operation}`
        : `${baseUrl}/pipeline/${operation}`;
      console.log(`[AI Pipeline Proxy FormData] Forwarding to: ${targetUrl}`);

      response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: forwardFormData,
      });
    }

    const responseContentType = response.headers.get('content-type') || '';
    let payload: string | Record<string, unknown>;
    if (responseContentType.includes('application/json')) {
      payload = (await response.json()) as Record<string, unknown>;
    } else {
      payload = await response.text();
    }

    if (!response.ok) {
      console.error(`[AI Pipeline Proxy Error] Upstream returned status ${response.status}:`, payload);
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to forward AI pipeline request',
      },
      { status: 500 }
    );
  }
}
