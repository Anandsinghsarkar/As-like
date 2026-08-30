"use client"

import * as React from "react"
import {
  Bot,
  BrainCircuit,
  Check,
  ChevronsUpDown,
  Clock3,
  Code2,
  Copy,
  GitCompareArrows,
  LoaderCircle,
  MessageSquareText,
  Plus,
  Search,
  Send,
  Settings2,
  Sparkles,
  User,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Toaster } from "@/components/ui/sonner"
import { AiModel, BUILT_IN_MODEL_COUNT, fallbackModels } from "@/lib/catalog"

type Mode = "chat" | "compare"
type PickerTarget = "chat" | "compare"
type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  model?: string
  latencyMs?: number
  error?: boolean
}
type CompareResult = {
  model: string
  ok: boolean
  content?: string
  error?: string
  latencyMs: number
}
type SavedThread = {
  id: string
  title: string
  messages: ChatMessage[]
  updatedAt: number
}

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Ready when you are. Pick any connected model, or keep Smart Router selected and I’ll send the request through your best available route.",
  model: "All AI",
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function providerMark(provider: string) {
  const palette = ["#ff6b35", "#4cc9f0", "#9b8cff", "#35d07f", "#ffd166"]
  let score = 0
  for (const character of provider) score += character.charCodeAt(0)
  return palette[score % palette.length]
}

function titleFromMessages(messages: ChatMessage[]) {
  const first = messages.find((message) => message.role === "user")?.content ?? "New conversation"
  return first.length > 34 ? `${first.slice(0, 34)}…` : first
}

export function AllAiStudio() {
  const [mode, setMode] = React.useState<Mode>("chat")
  const [models, setModels] = React.useState<AiModel[]>(fallbackModels)
  const [totalAvailable, setTotalAvailable] = React.useState(BUILT_IN_MODEL_COUNT)
  const [gatewayConfigured, setGatewayConfigured] = React.useState(false)
  const [catalogSource, setCatalogSource] = React.useState("bundled-preview")
  const [selectedModel, setSelectedModel] = React.useState("auto")
  const [compareModels, setCompareModels] = React.useState([
    "gpt-5.6",
    "claude-sonnet-4",
    "gemini-2.5-pro",
  ])
  const [prompt, setPrompt] = React.useState("")
  const [messages, setMessages] = React.useState<ChatMessage[]>([welcomeMessage])
  const [comparePrompt, setComparePrompt] = React.useState("")
  const [compareResults, setCompareResults] = React.useState<CompareResult[]>([])
  const [sending, setSending] = React.useState(false)
  const [modelPickerOpen, setModelPickerOpen] = React.useState(false)
  const [pickerTarget, setPickerTarget] = React.useState<PickerTarget>("chat")
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [threads, setThreads] = React.useState<SavedThread[]>([])
  const [threadId, setThreadId] = React.useState(createId)
  const transcriptRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("all-ai-threads")
      if (saved) setThreads(JSON.parse(saved))
    } catch {
      localStorage.removeItem("all-ai-threads")
    }

    fetch("/api/models", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        const received = Array.isArray(data.models) ? (data.models as AiModel[]) : []
        const hasAuto = received.some((model) => model.id === "auto")
        setModels(hasAuto ? received : [fallbackModels[0], ...received])
        setTotalAvailable(Number(data.totalAvailable) || received.length || BUILT_IN_MODEL_COUNT)
        setGatewayConfigured(Boolean(data.configured))
        setCatalogSource(String(data.source ?? "gateway"))
        if (data.warning) toast.warning(String(data.warning))
      })
      .catch(() => toast.error("Model catalog could not be refreshed."))
  }, [])

  React.useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, sending])

  const modelById = React.useMemo(
    () => new Map(models.map((model) => [model.id, model])),
    [models]
  )
  const selected = modelById.get(selectedModel) ?? {
    id: selectedModel,
    name: selectedModel,
    provider: "Custom",
  }
  const providerGroups = React.useMemo(() => {
    const groups = new Map<string, AiModel[]>()
    for (const model of models) {
      const group = groups.get(model.provider) ?? []
      group.push(model)
      groups.set(model.provider, group)
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [models])

  function persistThread(nextMessages: ChatMessage[]) {
    if (!nextMessages.some((message) => message.role === "user")) return
    setThreads((current) => {
      const next: SavedThread[] = [
        {
          id: threadId,
          title: titleFromMessages(nextMessages),
          messages: nextMessages,
          updatedAt: Date.now(),
        },
        ...current.filter((thread) => thread.id !== threadId),
      ].slice(0, 20)
      localStorage.setItem("all-ai-threads", JSON.stringify(next))
      return next
    })
  }

  function startNewChat() {
    persistThread(messages)
    setThreadId(createId())
    setMessages([welcomeMessage])
    setPrompt("")
    setMode("chat")
  }

  function openThread(thread: SavedThread) {
    persistThread(messages)
    setThreadId(thread.id)
    setMessages(thread.messages)
    setMode("chat")
  }

  function openModelPicker(target: PickerTarget) {
    setPickerTarget(target)
    setModelPickerOpen(true)
  }

  function chooseModel(model: AiModel) {
    if (pickerTarget === "chat") {
      setSelectedModel(model.id)
    } else {
      setCompareModels((current) => {
        if (current.includes(model.id)) return current
        if (current.length >= 4) {
          toast.info("Compare mode supports up to four models per request.")
          return current
        }
        return [...current, model.id]
      })
    }
    setModelPickerOpen(false)
  }

  async function runRequest(activeMode: Mode) {
    const input = (activeMode === "chat" ? prompt : comparePrompt).trim()
    if (!input || sending) return
    const modelsForRequest = activeMode === "chat" ? [selectedModel] : compareModels
    if (modelsForRequest.length === 0) {
      toast.error("Select at least one model.")
      return
    }

    setSending(true)
    if (activeMode === "chat") {
      const userMessage: ChatMessage = { id: createId(), role: "user", content: input }
      const nextMessages = [...messages, userMessage]
      setMessages(nextMessages)
      setPrompt("")

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            models: modelsForRequest,
            messages: nextMessages.map(({ role, content }) => ({ role, content })),
          }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.hint ?? data.error ?? "The request failed.")
        const result = data.results?.[0] as CompareResult | undefined
        const assistantMessage: ChatMessage = result?.ok
          ? {
              id: createId(),
              role: "assistant",
              content: result.content ?? "No response text was returned.",
              model: result.model,
              latencyMs: result.latencyMs,
            }
          : {
              id: createId(),
              role: "assistant",
              content: result?.error ?? "This model could not answer the request.",
              model: result?.model ?? selectedModel,
              latencyMs: result?.latencyMs,
              error: true,
            }
        const complete = [...nextMessages, assistantMessage]
        setMessages(complete)
        persistThread(complete)
      } catch (error) {
        const text = error instanceof Error ? error.message : "The request failed."
        const complete: ChatMessage[] = [
          ...nextMessages,
          { id: createId(), role: "assistant", content: text, model: "Connection", error: true },
        ]
        setMessages(complete)
        persistThread(complete)
        toast.error(text)
        if (!gatewayConfigured) setSettingsOpen(true)
      }
    } else {
      setComparePrompt("")
      setCompareResults([])
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            models: modelsForRequest,
            messages: [{ role: "user", content: input }],
          }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.hint ?? data.error ?? "The comparison failed.")
        setCompareResults(data.results ?? [])
      } catch (error) {
        const text = error instanceof Error ? error.message : "The comparison failed."
        toast.error(text)
        if (!gatewayConfigured) setSettingsOpen(true)
      }
    }
    setSending(false)
  }

  function handleComposerKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>, activeMode: Mode) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void runRequest(activeMode)
    }
  }

  async function copySetup() {
    const value = "AI_GATEWAY_BASE_URL=https://your-omniroute-host\nAI_GATEWAY_API_KEY=replace-with-server-key\nAI_ROUTER_MODEL=auto"
    await navigator.clipboard.writeText(value)
    toast.success("Environment template copied.")
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="inset" collapsible="icon" className="border-r-0">
        <SidebarHeader className="gap-3 px-3 py-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="brand-orbit shrink-0" aria-hidden="true">
              <BrainCircuit className="size-5" />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-black tracking-[0.18em] text-white">ALL AI</p>
              <p className="truncate text-[10px] uppercase tracking-[0.22em] text-white/45">One console. Every model.</p>
            </div>
          </div>
          <Button
            className="h-10 justify-start gap-2 rounded-xl bg-[#ff6b35] text-white shadow-[0_8px_30px_rgba(255,107,53,.22)] hover:bg-[#ff7d4d] group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:p-0"
            onClick={startNewChat}
          >
            <Plus />
            <span className="group-data-[collapsible=icon]:hidden">New conversation</span>
          </Button>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={mode === "chat"} onClick={() => setMode("chat")} tooltip="AI chat">
                    <MessageSquareText />
                    <span>AI chat</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={mode === "compare"} onClick={() => setMode("compare")} tooltip="Compare models">
                    <GitCompareArrows />
                    <span>Compare models</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => openModelPicker("chat")} tooltip="Model catalog">
                    <Search />
                    <span>Model catalog</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Recent</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {threads.length === 0 ? (
                  <li className="px-2 py-3 text-xs leading-5 text-white/35">Your latest chats stay on this device.</li>
                ) : (
                  threads.slice(0, 8).map((thread) => (
                    <SidebarMenuItem key={thread.id}>
                      <SidebarMenuButton onClick={() => openThread(thread)}>
                        <Clock3 />
                        <span className="truncate">{thread.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-3">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[0.035] p-3 text-left transition hover:border-white/15 hover:bg-white/[0.06]"
          >
            <span className={`status-dot ${gatewayConfigured ? "is-live" : ""}`} />
            <span className="min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="block text-xs font-semibold text-white">{gatewayConfigured ? "Gateway online" : "Setup required"}</span>
              <span className="block truncate text-[10px] text-white/40">{totalAvailable.toLocaleString()} models ready</span>
            </span>
            <Settings2 className="ml-auto size-4 text-white/40 group-data-[collapsible=icon]:hidden" />
          </button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="studio-shell min-h-svh overflow-hidden border border-white/6">
        <div className="route-rail" />
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/7 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-white/60 hover:bg-white/6 hover:text-white" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-white">{mode === "chat" ? "Unified chat" : "Model arena"}</h1>
                <Badge variant="outline" className="border-[#ff6b35]/30 bg-[#ff6b35]/8 text-[10px] text-[#ff9a73]">
                  {totalAvailable.toLocaleString()} models
                </Badge>
              </div>
              <p className="hidden text-[11px] text-white/35 sm:block">Live routing across your connected AI providers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`hidden gap-1.5 border-white/10 bg-white/4 text-[10px] sm:flex ${gatewayConfigured ? "text-[#66e3a4]" : "text-white/45"}`}>
              {gatewayConfigured ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
              {gatewayConfigured ? "Connected" : "Preview mode"}
            </Badge>
            <Button variant="ghost" size="icon" className="text-white/55 hover:bg-white/7 hover:text-white" onClick={() => setSettingsOpen(true)} aria-label="Open connection settings">
              <Settings2 />
            </Button>
          </div>
        </header>

        <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)} className="min-h-0 flex-1 gap-0">
          <div className="flex justify-center border-b border-white/6 px-4 py-2 md:hidden">
            <TabsList className="bg-white/5">
              <TabsTrigger value="chat"><MessageSquareText /> Chat</TabsTrigger>
              <TabsTrigger value="compare"><GitCompareArrows /> Compare</TabsTrigger>
            </TabsList>
          </div>

          {mode === "chat" ? (
            <section className="flex min-h-0 flex-1 flex-col" aria-label="AI chat">
              <div ref={transcriptRef} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
                  <button
                    onClick={() => openModelPicker("chat")}
                    className="model-switch group self-start rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-2 text-left transition hover:border-white/15 hover:bg-white/[0.06]"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="flex size-8 items-center justify-center rounded-xl bg-white/6" style={{ color: providerMark(selected.provider) }}>
                        {selected.id === "auto" ? <Zap className="size-4" /> : <Bot className="size-4" />}
                      </span>
                      <span>
                        <span className="block text-[10px] uppercase tracking-[0.18em] text-white/35">Active route</span>
                        <span className="block text-xs font-semibold text-white">{selected.name}</span>
                      </span>
                      <ChevronsUpDown className="ml-2 size-4 text-white/35 transition group-hover:text-white/70" />
                    </span>
                  </button>

                  {messages.map((message) => (
                    <article key={message.id} className={`message-row ${message.role === "user" ? "is-user" : ""}`}>
                      <div className={`message-avatar ${message.role === "user" ? "is-user" : ""}`}>
                        {message.role === "user" ? <User /> : <Sparkles />}
                      </div>
                      <div className={`message-card ${message.role === "user" ? "is-user" : ""} ${message.error ? "is-error" : ""}`}>
                        <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-white/35">
                          <span>{message.role === "user" ? "You" : message.model ?? "Assistant"}</span>
                          {message.latencyMs ? <span>• {(message.latencyMs / 1000).toFixed(1)}s</span> : null}
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-7 text-white/82">{message.content}</p>
                      </div>
                    </article>
                  ))}
                  {sending ? (
                    <article className="message-row">
                      <div className="message-avatar"><Sparkles /></div>
                      <div className="message-card flex items-center gap-3 text-sm text-white/50">
                        <LoaderCircle className="size-4 animate-spin text-[#ff6b35]" /> Routing request to {selected.name}…
                      </div>
                    </article>
                  ) : null}
                </div>
              </div>

              <Composer
                value={prompt}
                onChange={setPrompt}
                onKeyDown={(event) => handleComposerKeyDown(event, "chat")}
                onSend={() => void runRequest("chat")}
                sending={sending}
                label={selected.id === "auto" ? "Smart Router will choose the route" : `Sending to ${selected.name}`}
              />
            </section>
          ) : (
            <section className="flex min-h-0 flex-1 flex-col" aria-label="Compare AI models">
              <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
                <div className="mx-auto w-full max-w-6xl">
                  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#ff8b61]">Parallel intelligence</p>
                      <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">One prompt. Multiple minds.</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Compare speed and answer quality across up to four connected models.</p>
                    </div>
                    <Button variant="outline" className="border-white/10 bg-white/4 text-white hover:bg-white/8" onClick={() => openModelPicker("compare")}>
                      <Plus /> Add model
                    </Button>
                  </div>

                  <div className="mb-6 flex flex-wrap gap-2">
                    {compareModels.map((modelId) => {
                      const model = modelById.get(modelId)
                      return (
                        <span key={modelId} className="flex items-center gap-2 rounded-full border border-white/9 bg-white/[0.035] py-1.5 pl-3 pr-1.5 text-xs text-white/70">
                          <span className="size-1.5 rounded-full" style={{ background: providerMark(model?.provider ?? modelId) }} />
                          {model?.name ?? modelId}
                          <button
                            onClick={() => setCompareModels((current) => current.filter((id) => id !== modelId))}
                            className="rounded-full p-1 text-white/30 hover:bg-white/8 hover:text-white"
                            aria-label={`Remove ${model?.name ?? modelId}`}
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      )
                    })}
                  </div>

                  {compareResults.length > 0 ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {compareResults.map((result) => {
                        const model = modelById.get(result.model)
                        return (
                          <article key={result.model} className={`compare-card ${result.ok ? "" : "is-error"}`}>
                            <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/6 pb-4">
                              <div className="flex items-center gap-3">
                                <span className="flex size-9 items-center justify-center rounded-xl bg-white/5" style={{ color: providerMark(model?.provider ?? result.model) }}>
                                  <Bot className="size-4" />
                                </span>
                                <div>
                                  <h3 className="text-sm font-semibold text-white">{model?.name ?? result.model}</h3>
                                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">{model?.provider ?? "AI provider"}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className="border-white/8 bg-white/3 text-[10px] text-white/45">{(result.latencyMs / 1000).toFixed(1)}s</Badge>
                            </div>
                            <p className={`whitespace-pre-wrap text-sm leading-7 ${result.ok ? "text-white/76" : "text-red-300"}`}>{result.ok ? result.content : result.error}</p>
                          </article>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="arena-empty">
                      <GitCompareArrows className="size-8 text-[#ff6b35]" />
                      <h3 className="mt-4 text-base font-semibold text-white">Your comparison board is ready</h3>
                      <p className="mt-2 max-w-md text-center text-sm leading-6 text-white/40">Write one prompt below to receive side-by-side answers from every selected model.</p>
                    </div>
                  )}
                </div>
              </div>

              <Composer
                value={comparePrompt}
                onChange={setComparePrompt}
                onKeyDown={(event) => handleComposerKeyDown(event, "compare")}
                onSend={() => void runRequest("compare")}
                sending={sending}
                label={`${compareModels.length} models will answer in parallel`}
              />
            </section>
          )}
        </Tabs>
      </SidebarInset>

      <CommandDialog open={modelPickerOpen} onOpenChange={setModelPickerOpen} title="Choose an AI model" description="Search all models exposed by your connected gateway." className="border-white/10 bg-[#101116] text-white sm:max-w-2xl">
        <CommandInput placeholder={`Search ${totalAvailable.toLocaleString()} models or paste a model ID…`} />
        <CommandList className="max-h-[62vh]">
          <CommandEmpty>No matching model found. Add it to your OmniRoute catalog first.</CommandEmpty>
          {providerGroups.map(([provider, providerModels]) => (
            <CommandGroup key={provider} heading={`${provider} · ${providerModels.length}`}>
              {providerModels.map((model) => {
                const chosen = pickerTarget === "chat" ? selectedModel === model.id : compareModels.includes(model.id)
                return (
                  <CommandItem key={`${provider}-${model.id}`} value={`${model.name} ${model.id} ${provider}`} onSelect={() => chooseModel(model)} className="rounded-xl py-3">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-white/5" style={{ color: providerMark(provider) }}><Bot className="size-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-white">{model.name}</span>
                      <span className="block truncate text-[11px] text-white/35">{model.id}</span>
                    </span>
                    {chosen ? <Check className="size-4 text-[#66e3a4]" /> : null}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="border-white/10 bg-[#101116] text-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Settings2 className="size-5 text-[#ff6b35]" /> AI gateway connection</DialogTitle>
            <DialogDescription className="text-white/45">Provider keys stay on the server. The browser never receives them.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.035] p-4">
              <div className="flex items-center gap-3">
                <span className={`status-dot ${gatewayConfigured ? "is-live" : ""}`} />
                <div>
                  <p className="text-sm font-semibold">{gatewayConfigured ? "OmniRoute connected" : "OmniRoute not configured"}</p>
                  <p className="text-xs text-white/40">Catalog source: {catalogSource.replaceAll("-", " ")}</p>
                </div>
              </div>
              <Badge variant="outline" className={gatewayConfigured ? "border-emerald-400/20 text-emerald-300" : "border-amber-400/20 text-amber-300"}>{gatewayConfigured ? "Live" : "Preview"}</Badge>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Server environment</p>
                <Button variant="ghost" size="sm" onClick={() => void copySetup()} className="text-white/55 hover:bg-white/7 hover:text-white"><Copy /> Copy</Button>
              </div>
              <pre className="overflow-x-auto rounded-2xl border border-white/8 bg-black/25 p-4 text-xs leading-6 text-[#8fdcf5]">AI_GATEWAY_BASE_URL=https://your-omniroute-host{"\n"}AI_GATEWAY_API_KEY=replace-with-server-key{"\n"}AI_ROUTER_MODEL=auto</pre>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/7 p-3">
                <Code2 className="mb-2 size-4 text-[#9b8cff]" />
                <p className="text-xs font-semibold">OpenAI-compatible</p>
                <p className="mt-1 text-[11px] leading-5 text-white/35">Uses /v1/models and /v1/chat/completions.</p>
              </div>
              <div className="rounded-xl border border-white/7 p-3">
                <BrainCircuit className="mb-2 size-4 text-[#ff8b61]" />
                <p className="text-xs font-semibold">All-provider routing</p>
                <p className="mt-1 text-[11px] leading-5 text-white/35">Every provider enabled in OmniRoute appears automatically.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  )
}

function Composer({
  value,
  onChange,
  onKeyDown,
  onSend,
  sending,
  label,
}: {
  value: string
  onChange: (value: string) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  sending: boolean
  label: string
}) {
  return (
    <div className="shrink-0 border-t border-white/6 bg-[#0b0c10]/92 px-4 py-4 backdrop-blur-xl md:px-8">
      <div className="composer mx-auto max-w-4xl">
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask anything, build something, or paste code…"
          aria-label="Message"
          className="min-h-12 max-h-40 resize-none border-0 bg-transparent px-4 py-3 text-sm text-white shadow-none placeholder:text-white/28 focus-visible:ring-0 dark:bg-transparent"
        />
        <div className="flex items-center justify-between gap-3 border-t border-white/5 px-3 py-2">
          <span className="truncate text-[10px] text-white/32">{label} · Enter to send</span>
          <Button size="icon" onClick={onSend} disabled={sending || !value.trim()} className="size-9 rounded-xl bg-[#ff6b35] text-white hover:bg-[#ff7d4d]">
            {sending ? <LoaderCircle className="animate-spin" /> : <Send />}
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
