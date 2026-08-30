export type AiModel = {
  id: string
  name: string
  provider: string
  contextWindow?: number | null
  capabilities?: string[]
}

export const BUILT_IN_MODEL_COUNT = 1320

export const fallbackModels: AiModel[] = [
  { id: "auto", name: "Smart Router", provider: "OmniRoute", capabilities: ["auto"] },
  { id: "gpt-5.6", name: "GPT-5.6", provider: "OpenAI", capabilities: ["reasoning", "vision", "tools"] },
  { id: "gpt-5.6-sol", name: "GPT-5.6 Sol", provider: "OpenAI", capabilities: ["coding", "reasoning", "tools"] },
  { id: "gpt-5.6-terra", name: "GPT-5.6 Terra", provider: "OpenAI", capabilities: ["reasoning", "tools"] },
  { id: "gpt-5.5", name: "GPT-5.5", provider: "OpenAI", capabilities: ["reasoning", "vision", "tools"] },
  { id: "gpt-5.4", name: "GPT-5.4", provider: "OpenAI", capabilities: ["reasoning", "vision", "tools"] },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "OpenAI", capabilities: ["vision", "tools"] },
  { id: "o3", name: "o3", provider: "OpenAI", capabilities: ["reasoning", "tools"] },
  { id: "claude-opus-4-1", name: "Claude Opus 4.1", provider: "Anthropic", capabilities: ["reasoning", "coding", "tools"] },
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", provider: "Anthropic", capabilities: ["coding", "vision", "tools"] },
  { id: "claude-3-7-sonnet-latest", name: "Claude 3.7 Sonnet", provider: "Anthropic", capabilities: ["reasoning", "vision", "tools"] },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", capabilities: ["reasoning", "vision", "tools"] },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", capabilities: ["fast", "vision", "tools"] },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google", capabilities: ["fast", "vision"] },
  { id: "grok-4", name: "Grok 4", provider: "xAI", capabilities: ["reasoning", "tools"] },
  { id: "grok-3", name: "Grok 3", provider: "xAI", capabilities: ["reasoning", "tools"] },
  { id: "deepseek-chat", name: "DeepSeek Chat", provider: "DeepSeek", capabilities: ["coding", "tools"] },
  { id: "deepseek-reasoner", name: "DeepSeek Reasoner", provider: "DeepSeek", capabilities: ["reasoning", "coding"] },
  { id: "qwen3-coder-plus", name: "Qwen3 Coder Plus", provider: "Alibaba", capabilities: ["coding", "tools"] },
  { id: "qwen3-max", name: "Qwen3 Max", provider: "Alibaba", capabilities: ["reasoning", "tools"] },
  { id: "glm-5", name: "GLM-5", provider: "Z.AI", capabilities: ["reasoning", "coding", "tools"] },
  { id: "kimi-k2.5", name: "Kimi K2.5", provider: "Moonshot", capabilities: ["reasoning", "coding", "tools"] },
  { id: "mistral-large-latest", name: "Mistral Large", provider: "Mistral", capabilities: ["reasoning", "tools"] },
  { id: "codestral-latest", name: "Codestral", provider: "Mistral", capabilities: ["coding"] },
  { id: "llama-4-maverick", name: "Llama 4 Maverick", provider: "Meta", capabilities: ["vision", "tools"] },
  { id: "command-r-plus", name: "Command R+", provider: "Cohere", capabilities: ["reasoning", "tools"] },
  { id: "sonar-pro", name: "Sonar Pro", provider: "Perplexity", capabilities: ["search", "reasoning"] },
  { id: "nvidia/llama-3.1-nemotron-ultra-253b-v1", name: "Nemotron Ultra", provider: "NVIDIA", capabilities: ["reasoning"] },
]

export function normalizeModels(input: unknown): AiModel[] {
  const source = Array.isArray(input)
    ? input
    : input && typeof input === "object" && "data" in input && Array.isArray(input.data)
      ? input.data
      : input && typeof input === "object" && "models" in input && Array.isArray(input.models)
        ? input.models
        : []

  const seen = new Set<string>()
  const models: AiModel[] = []

  for (const value of source) {
    if (!value || typeof value !== "object") continue
    const item = value as Record<string, unknown>
    const id = String(item.id ?? item.model ?? item.name ?? "").trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    const provider = String(item.provider ?? item.owned_by ?? inferProvider(id))
    models.push({
      id,
      name: String(item.name ?? humanizeModelId(id)),
      provider,
      contextWindow:
        typeof item.context_length === "number"
          ? item.context_length
          : typeof item.contextWindow === "number"
            ? item.contextWindow
            : null,
    })
  }

  return models.sort((a, b) => a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name))
}

export function inferProvider(id: string) {
  const lower = id.toLowerCase()
  if (lower.includes("claude")) return "Anthropic"
  if (lower.includes("gemini")) return "Google"
  if (lower.includes("gpt") || /(^|\/)o[134]-/.test(lower)) return "OpenAI"
  if (lower.includes("grok")) return "xAI"
  if (lower.includes("deepseek")) return "DeepSeek"
  if (lower.includes("qwen")) return "Alibaba"
  if (lower.includes("mistral") || lower.includes("codestral")) return "Mistral"
  if (lower.includes("llama")) return "Meta"
  return id.includes("/") ? id.split("/")[0] : "Other"
}

export function humanizeModelId(id: string) {
  return id
    .split("/")
    .at(-1)!
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
