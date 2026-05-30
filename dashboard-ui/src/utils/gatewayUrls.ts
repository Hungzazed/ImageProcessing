function normalizeGatewayOrigin(value: string) {
  return value.replace(/\/$/, '');
}

export function getGatewayBaseUrl() {
  return normalizeGatewayOrigin(process.env.NEXT_PUBLIC_GATEWAY_URL || "");
}

export function getProdGatewayBaseUrl() {
  const base = getGatewayBaseUrl();
  if (!base) return '';
  return base.endsWith('/prod') ? base : `${base}/prod`;
}

export function getPipelineGatewayBaseUrl() {
  const configuredPipelineBase = normalizeGatewayOrigin(process.env.NEXT_PUBLIC_AI_PIPELINE_URL || "");
  if (configuredPipelineBase) {
    return configuredPipelineBase;
  }

  return normalizeGatewayOrigin(process.env.NEXT_PUBLIC_GATEWAY_URL || "");
}