import { NextRequest, NextResponse } from 'next/server';
import { getPipelineGatewayBaseUrl } from '@/utils/gatewayUrls';

const DEFAULT_BASE_URL = getPipelineGatewayBaseUrl();

function getBaseUrl() {
  return DEFAULT_BASE_URL.replace(/\/$/, '');
}

export async function POST(request: NextRequest) {
  try {
    const incomingFormData = await request.formData();
    const operation = String(incomingFormData.get('operation') || '').trim();

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
        // Use new File instead of new Blob to ensure MIME type (e.g. image/jpeg) is correctly set
        const file = new File([arrayBuffer], value.name, { type: value.type });
        forwardFormData.append(key, file);
      } else {
        forwardFormData.append(key, value as FormDataEntryValue);
      }
    }

    const authHeader = request.headers.get('authorization');
    console.log(`[AI Proxy Debug] Incoming Authorization: ${authHeader ? authHeader.substring(0, 30) + '...' : 'MISSING'}`);
    console.log(`[AI Proxy Debug] Request headers keys:`, Array.from(request.headers.keys()));

    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const targetUrl = `${getBaseUrl()}/${operation}`;
    console.log(`[AI Pipeline Proxy] Forwarding request to: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: forwardFormData,
    });

    let payload: any;
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      try {
        payload = await response.json();
      } catch (jsonError) {
        console.error('[AI Pipeline Proxy] Failed to parse response as JSON, falling back to text:', jsonError);
        try {
          payload = await response.text();
        } catch {
          payload = 'Failed to read response body';
        }
      }
    } else {
      try {
        payload = await response.text();
      } catch {
        payload = 'Failed to read response body';
      }
    }

    if (!response.ok) {
      console.error(`[AI Pipeline Proxy Error] Upstream returned status ${response.status}:`, payload);
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (error: unknown) {
    console.error('[AI Pipeline Proxy Critical Catch Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to forward AI pipeline request',
      },
      { status: 500 }
    );
  }
}
