export function getGatewayConfig() {
  return {
    baseUrl: process.env.AI_GATEWAY_BASE_URL?.trim().replace(/\/+$/, "") ?? "",
    apiKey: process.env.AI_GATEWAY_API_KEY?.trim() ?? "",
    routerModel: process.env.AI_ROUTER_MODEL?.trim() ?? "auto",
  }
}

export function gatewayUrl(baseUrl: string, path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  if (baseUrl.endsWith("/v1") && normalizedPath.startsWith("/v1/")) {
    return `${baseUrl}${normalizedPath.slice(3)}`
  }
  return `${baseUrl}${normalizedPath}`
}

export function gatewayHeaders(apiKey: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`
  return headers
}
