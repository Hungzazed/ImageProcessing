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
        const blob = new Blob([arrayBuffer], { type: value.type });
        forwardFormData.append(key, blob, value.name);
      } else {
        forwardFormData.append(key, value as FormDataEntryValue);
      }
    }

    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(`${getBaseUrl()}/${operation}`, {
      method: 'POST',
      headers,
      body: forwardFormData,
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : await response.text();

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
