const DEFAULT_GATEWAY_URL = '';

function normalizeGatewayOrigin(value: string) {
  return value.replace(/\/$/, '');
}

export function getGatewayBaseUrl() {
  return normalizeGatewayOrigin(process.env.NEXT_PUBLIC_GATEWAY_URL || DEFAULT_GATEWAY_URL);
}

export function getProdGatewayBaseUrl() {
  return `${getGatewayBaseUrl()}/prod`;
}

export function getPipelineGatewayBaseUrl() {
  return `${getGatewayBaseUrl()}/pipeline`;
}