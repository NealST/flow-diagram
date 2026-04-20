import type { Node, Edge } from '@xyflow/react'
import type { RoleNodeData } from './nodes/RoleNode'
import type { AnimatedEdgeData } from './edges/AnimatedEdge'

export type AIConfig = {
  apiKey: string
  baseUrl: string
  model: string
}

const DEFAULT_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-4o-mini'

const STORAGE_KEY = 'flow-diagram-ai-config'

export function loadAIConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AIConfig
  } catch { /* ignore */ }
  return { apiKey: '', baseUrl: DEFAULT_BASE_URL, model: DEFAULT_MODEL }
}

export function saveAIConfig(config: AIConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

const SYSTEM_PROMPT = `You are a flow diagram generator. Given a user's description, generate a JSON object representing a flow diagram.

Output ONLY valid JSON with this exact structure:
{
  "nodes": [
    {
      "id": "unique_id",
      "label": "Display Label",
      "icon": "icon_key",
      "color": "blue",
      "description": "Short description"
    }
  ],
  "edges": [
    {
      "source": "source_node_id",
      "target": "target_node_id",
      "label": "Edge label (optional)"
    }
  ]
}

Rules:
- Use descriptive but short labels (2-6 characters for Chinese, 2-4 words for English)
- Available colors: blue, green, orange, purple, pink, teal, red
- Use appropriate icon keys for the node's role. Available keys: user, brain, cpu, wrench, database, gear, box, message, book, globe, folder, clipboard, sparkle, lock, rocket, network, image, ruler, film
- Create a clear flow with logical connections
- Node IDs should be lowercase snake_case
- Include 4-12 nodes typically
- Each node should have a short description (2-6 chars)
- Edge labels should be concise action verbs
- Arrange the flow logically (input → processing → output)
- Do NOT include any markdown formatting, code fences, or explanation - ONLY the JSON object`

export async function generateFlowFromPrompt(
  prompt: string,
  config: AIConfig,
  onChunk?: (text: string) => void,
): Promise<{
  nodes: Node<RoleNodeData>[]
  edges: Edge<AnimatedEdgeData>[]
}> {
  const url = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`

  const body = {
    model: config.model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    stream: !!onChunk,
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText)
    throw new Error(`API error ${res.status}: ${errorText}`)
  }

  let fullText = ''

  if (onChunk && res.body) {
    // Stream mode
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') break

        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta?.content
          if (delta) {
            fullText += delta
            onChunk(fullText)
          }
        } catch { /* skip malformed chunks */ }
      }
    }
  } else {
    // Non-stream mode
    const data = await res.json()
    fullText = data.choices?.[0]?.message?.content ?? ''
  }

  return parseAIResponse(fullText)
}

const EDGE_COLORS = [
  '#6a9fd4', '#3a8f4f', '#c07830', '#9070c0', '#b05a7e', '#2e9e93', '#b54e4e',
]

function parseAIResponse(text: string): {
  nodes: Node<RoleNodeData>[]
  edges: Edge<AnimatedEdgeData>[]
} {
  // Extract JSON from response (handle possible markdown code fences)
  let jsonStr = text.trim()
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim()
  }
  // Also try to find JSON object directly
  const objMatch = jsonStr.match(/\{[\s\S]*\}/)
  if (objMatch) {
    jsonStr = objMatch[0]
  }

  const data = JSON.parse(jsonStr)

  if (!data.nodes || !Array.isArray(data.nodes)) {
    throw new Error('Invalid AI response: missing nodes array')
  }

  // Layout: topological layering
  const nodeIds = data.nodes.map((n: { id: string }) => n.id)
  const edgeData = data.edges ?? []
  const positions = layoutFromEdges(nodeIds, edgeData)

  const nodes: Node<RoleNodeData>[] = data.nodes.map((n: {
    id: string
    label: string
    icon?: string
    color?: string
    description?: string
  }) => ({
    id: n.id,
    type: 'roleNode',
    position: positions.get(n.id) ?? { x: 0, y: 0 },
    data: {
      label: n.label,
      icon: n.icon ?? 'box',
      color: n.color ?? 'blue',
      description: n.description ?? '',
    },
  }))

  const edges: Edge<AnimatedEdgeData>[] = edgeData.map((e: {
    source: string
    target: string
    label?: string
  }, i: number) => ({
    id: `e-${e.source}-${e.target}-${i}`,
    source: e.source,
    target: e.target,
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'animatedEdge',
    data: {
      label: e.label || undefined,
      color: EDGE_COLORS[i % EDGE_COLORS.length],
      speed: 'normal' as const,
      pathType: 'smoothstep' as const,
      offset: 25 + (i % 3) * 10,
    },
  }))

  return { nodes, edges }
}

function layoutFromEdges(
  nodeIds: string[],
  edges: { source: string; target: string }[],
): Map<string, { x: number; y: number }> {
  const inDeg = new Map<string, number>()
  const adj = new Map<string, string[]>()
  for (const id of nodeIds) {
    inDeg.set(id, 0)
    adj.set(id, [])
  }
  for (const e of edges) {
    if (adj.has(e.source) && inDeg.has(e.target)) {
      adj.get(e.source)!.push(e.target)
      inDeg.set(e.target, (inDeg.get(e.target) ?? 0) + 1)
    }
  }

  // BFS topo sort
  const queue = nodeIds.filter((id) => (inDeg.get(id) ?? 0) === 0)
  const layer = new Map<string, number>()
  const visited = new Set<string>()
  for (const id of queue) layer.set(id, 0)

  let qi = 0
  while (qi < queue.length) {
    const u = queue[qi++]
    visited.add(u)
    for (const v of adj.get(u) ?? []) {
      layer.set(v, Math.max(layer.get(v) ?? 0, (layer.get(u) ?? 0) + 1))
      inDeg.set(v, (inDeg.get(v) ?? 0) - 1)
      if ((inDeg.get(v) ?? 0) <= 0 && !visited.has(v) && !queue.includes(v)) {
        queue.push(v)
      }
    }
  }
  for (const id of nodeIds) {
    if (!visited.has(id)) layer.set(id, 0)
  }

  // Group by layer
  const layers = new Map<number, string[]>()
  for (const id of nodeIds) {
    const l = layer.get(id) ?? 0
    if (!layers.has(l)) layers.set(l, [])
    layers.get(l)!.push(id)
  }

  const NODE_W = 220
  const NODE_H = 120
  const GAP_X = 100
  const GAP_Y = 60

  const positions = new Map<string, { x: number; y: number }>()
  for (const [l, ids] of layers) {
    for (let i = 0; i < ids.length; i++) {
      const offset = (i - (ids.length - 1) / 2)
      positions.set(ids[i], {
        x: l * (NODE_W + GAP_X),
        y: 250 + offset * (NODE_H + GAP_Y),
      })
    }
  }
  return positions
}
