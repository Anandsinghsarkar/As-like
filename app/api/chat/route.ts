import { NextRequest, NextResponse } from "next/server"

import { gatewayHeaders, gatewayUrl, getGatewayConfig } from "@/lib/gateway"

export const dynamic = "force-dynamic"

type ChatMessage = { role: "system" | "user" | "assistant"; content: string }

function isMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false
  const message = value as Record<string, unknown>
  return (
    (message.role === "system" || message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0
  )
}

function extractText(payload: unknown) {
  if (!payload || typeof payload !== "object") return ""
  const data = payload as Record<string, unknown>
  const choices = Array.isArray(data.choices) ? data.choices : []
  const first = choices[0] as Record<string, unknown> | undefined
  const message = first?.message as Record<string, unknown> | undefined
  if (typeof message?.content === "string") return message.content
  if (Array.isArray(message?.content)) {
    return message.content
      .map((part) =>
        part && typeof part === "object" && "text" in part ? String(part.text ?? "") : ""
      )
      .join("")
  }
  if (typeof data.output_text === "string") return data.output_text
  return "The provider returned a response without readable text."
}

async function askModel(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[]
) {
  const startedAt = Date.now()
  try {
    const response = await fetch(gatewayUrl(baseUrl, "/v1/chat/completions"), {
      method: "POST",
      headers: gatewayHeaders(apiKey),
      body: JSON.stringify({ model, messages, stream: false }),
    })
    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>
    if (!response.ok) {
      const upstream = payload.error as Record<string, unknown> | string | undefined
      const message =
        typeof upstream === "string"
          ? upstream
          : typeof upstream?.message === "string"
            ? upstream.message
            : `Provider returned ${response.status}.`
      return { model, ok: false, error: message, latencyMs: Date.now() - startedAt }
    }
    return {
      model,
      ok: true,
      content: extractText(payload),
      latencyMs: Date.now() - startedAt,
      usage: payload.usage ?? null,
    }
  } catch (error) {
    return {
      model,
      ok: false,
      error: error instanceof Error ? error.message : "Unable to reach the AI gateway.",
      latencyMs: Date.now() - startedAt,
    }
  }
}

export async function POST(request: NextRequest) {
  const { baseUrl, apiKey, routerModel } = getGatewayConfig()
  if (!baseUrl) {
    return NextResponse.json(
      {
        error: "AI gateway is not connected yet.",
        code: "GATEWAY_NOT_CONFIGURED",
        hint: "Set AI_GATEWAY_BASE_URL and AI_GATEWAY_API_KEY on the server.",
      },
      { status: 503 }
    )
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const messages = Array.isArray(body?.messages) ? body.messages.filter(isMessage).slice(-40) : []
  const requested = Array.isArray(body?.models)
    ? body.models.map(String).map((value) => value.trim()).filter(Boolean)
    : []
  const models = [...new Set(requested)].slice(0, 4).map((model) =>
    model === "auto" ? routerModel : model
  )

  if (messages.length === 0 || models.length === 0) {
    return NextResponse.json({ error: "At least one model and one message are required." }, { status: 400 })
  }

  const results = await Promise.all(models.map((model) => askModel(baseUrl, apiKey, model, messages)))
  return NextResponse.json({ results })
}
