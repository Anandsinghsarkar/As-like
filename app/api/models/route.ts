import { NextResponse } from "next/server"

import { BUILT_IN_MODEL_COUNT, fallbackModels, normalizeModels } from "@/lib/catalog"
import { gatewayHeaders, gatewayUrl, getGatewayConfig } from "@/lib/gateway"

export const dynamic = "force-dynamic"

export async function GET() {
  const { baseUrl, apiKey } = getGatewayConfig()

  if (!baseUrl) {
    return NextResponse.json({
      configured: false,
      source: "bundled-preview",
      totalAvailable: BUILT_IN_MODEL_COUNT,
      models: fallbackModels,
    })
  }

  const endpoints = [gatewayUrl(baseUrl, "/v1/models"), gatewayUrl(baseUrl, "/api/models")]
  let lastError = "Gateway model catalog is unavailable."

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: gatewayHeaders(apiKey),
        cache: "no-store",
      })
      if (!response.ok) {
        lastError = `Gateway returned ${response.status} while loading models.`
        continue
      }
      const models = normalizeModels(await response.json())
      if (models.length > 0) {
        return NextResponse.json({
          configured: true,
          source: "gateway",
          totalAvailable: models.length,
          models,
        })
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError
    }
  }

  return NextResponse.json(
    {
      configured: true,
      source: "bundled-fallback",
      totalAvailable: BUILT_IN_MODEL_COUNT,
      warning: lastError,
      models: fallbackModels,
    },
    { status: 200 }
  )
}
