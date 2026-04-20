import type { Node, Edge } from '@xyflow/react'
import type { RoleNodeData } from './nodes/RoleNode'
import type { AnimatedEdgeData } from './edges/AnimatedEdge'

/**
 * Parse a Mermaid flowchart string into React Flow nodes and edges.
 * Supports: graph LR/TD/TB/RL/BT, node shapes [], (), (()), {}, and edge labels.
 */

type Direction = 'LR' | 'RL' | 'TD' | 'TB' | 'BT'

const COLORS: RoleNodeData['color'][] = ['blue', 'green', 'orange', 'purple', 'pink', 'teal', 'red']

const EDGE_COLORS = [
  '#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ec4899', '#14b8a6', '#ef4444',
]

export function parseMermaid(input: string): {
  nodes: Node<RoleNodeData>[]
  edges: Edge<AnimatedEdgeData>[]
} | null {
  const lines = input.trim().split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return null

  // Detect direction
  let direction: Direction = 'LR'
  let startIdx = 0
  const headerMatch = lines[0].match(/^(?:graph|flowchart)\s+(LR|RL|TD|TB|BT)/i)
  if (headerMatch) {
    direction = headerMatch[1].toUpperCase() as Direction
    startIdx = 1
  } else if (/^(?:graph|flowchart)\s*$/i.test(lines[0])) {
    startIdx = 1
  }

  const nodeMap = new Map<string, { label: string; shape: string }>()
  const edgeList: { source: string; target: string; label: string }[] = []

  // Parse all content lines
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i]
    // Skip comments and directives
    if (line.startsWith('%%') || line.startsWith('classDef') || line.startsWith('class ') || line.startsWith('style ') || line.startsWith('subgraph') || line === 'end') continue

    parseLineEdges(line, nodeMap, edgeList)
  }

  if (nodeMap.size === 0) return null

  // Layout nodes in a grid
  const nodeIds = Array.from(nodeMap.keys())
  const { positions } = layoutNodes(nodeIds, edgeList, direction)

  // Build React Flow nodes
  const nodes: Node<RoleNodeData>[] = nodeIds.map((id, i) => {
    const info = nodeMap.get(id)!
    const pos = positions.get(id) ?? { x: 0, y: 0 }
    return {
      id,
      type: 'roleNode',
      position: pos,
      data: {
        label: info.label,
        icon: guessIcon(info.label),
        color: COLORS[i % COLORS.length],
      },
    }
  })

  // Build React Flow edges
  const edges: Edge<AnimatedEdgeData>[] = edgeList.map((e, i) => {
    const isHorizontal = direction === 'LR' || direction === 'RL'
    return {
      id: `e-${e.source}-${e.target}-${i}`,
      source: e.source,
      target: e.target,
      sourceHandle: isHorizontal ? 'right' : 'bottom',
      targetHandle: isHorizontal ? 'left' : 'top',
      type: 'animatedEdge',
      data: {
        label: e.label || undefined,
        color: EDGE_COLORS[i % EDGE_COLORS.length],
        speed: 'normal' as const,
        pathType: 'smoothstep' as const,
        offset: 25 + (i % 3) * 10,
      },
    }
  })

  return { nodes, edges }
}

// ─── Line Parser ────────────────────────────────────────────────────

// Edge patterns: -->, --->, -. .-> (dotted), == ==> (thick), -- text -->
const EDGE_RE =
  /([A-Za-z0-9_]+)(?:\[([^\]]*)\]|\(([^)]*)\)|\(\(([^)]*)\)\)|\{([^}]*)\})?\s*(-->|---->|-.->|-\.->|==>|--\s+[^-|>]+\s+-->|--\s+[^-|>]+\s+--->)\s*([A-Za-z0-9_]+)(?:\[([^\]]*)\]|\(([^)]*)\)|\(\(([^)]*)\)\)|\{([^}]*)\})?/g

function parseLineEdges(
  line: string,
  nodeMap: Map<string, { label: string; shape: string }>,
  edgeList: { source: string; target: string; label: string }[],
) {
  // Try to match chain: A --> B --> C
  // We use a simpler approach: repeatedly find edges
  const simplified = line.replace(/\s+/g, ' ')

  // First, extract standalone node declarations: A[Label]
  const standaloneRe = /^([A-Za-z0-9_]+)(?:\[([^\]]*)\]|\(([^)]*)\)|\(\(([^)]*)\)\)|\{([^}]*)\})\s*$/
  const standaloneMatch = standaloneRe.exec(simplified)
  if (standaloneMatch) {
    const id = standaloneMatch[1]
    const label = standaloneMatch[2] ?? standaloneMatch[3] ?? standaloneMatch[4] ?? standaloneMatch[5] ?? id
    registerNode(nodeMap, id, label, 'box')
    return
  }

  // Parse edges using a token-based approach
  const tokens = tokenizeMermaidLine(simplified)
  if (tokens.length === 0) return

  for (let t = 0; t < tokens.length; t++) {
    const tok = tokens[t]
    if (tok.type === 'node') {
      registerNode(nodeMap, tok.id, tok.label, tok.shape)
    } else if (tok.type === 'edge') {
      const prev = tokens[t - 1]
      const next = tokens[t + 1]
      if (prev?.type === 'node' && next?.type === 'node') {
        edgeList.push({ source: prev.id, target: next.id, label: tok.label })
      }
    }
  }
}

type MermaidToken =
  | { type: 'node'; id: string; label: string; shape: string }
  | { type: 'edge'; label: string }

function tokenizeMermaidLine(line: string): MermaidToken[] {
  const tokens: MermaidToken[] = []
  let rest = line.trim()

  while (rest.length > 0) {
    rest = rest.trimStart()
    if (rest.length === 0) break

    // Try to match a node: ID or ID[label] or ID(label) or ID((label)) or ID{label}
    const nodeRe = /^([A-Za-z0-9_]+)(?:\["?([^\]"]*)"?\]|\("?([^)"]*)"?\)|\(\("?([^)"]*)"?\)\)|\{"?([^}"]*)"?\})?/
    const nodeMatch = nodeRe.exec(rest)

    if (nodeMatch && nodeMatch[0].length > 0) {
      // Check this isn't an edge keyword
      if (/^(graph|flowchart|subgraph|end|classDef|class|style)$/i.test(nodeMatch[1])) {
        break
      }
      const id = nodeMatch[1]
      const label = nodeMatch[2] ?? nodeMatch[3] ?? nodeMatch[4] ?? nodeMatch[5] ?? id
      const shape = nodeMatch[2] ? 'box' : nodeMatch[3] ? 'round' : nodeMatch[4] ? 'circle' : nodeMatch[5] ? 'diamond' : 'box'
      tokens.push({ type: 'node', id, label, shape })
      rest = rest.slice(nodeMatch[0].length).trimStart()

      // Try to match an edge after the node
      const edgeRe = /^(?:--\s+"?([^">\n]+?)"?\s+-->|--\s+"?([^">\n]+?)"?\s+--->|-->\|"?([^"|]*)"?\||-->|---->|-\.->|-.->|==>|===)/
      const edgeMatch = edgeRe.exec(rest)
      if (edgeMatch) {
        const edgeLabel = edgeMatch[1] ?? edgeMatch[2] ?? edgeMatch[3] ?? ''
        tokens.push({ type: 'edge', label: edgeLabel.trim() })
        rest = rest.slice(edgeMatch[0].length).trimStart()
      }
      continue
    }

    // Skip unknown characters
    rest = rest.slice(1)
  }

  return tokens
}

function registerNode(
  map: Map<string, { label: string; shape: string }>,
  id: string,
  label: string,
  shape: string,
) {
  // Only update if not already registered, or if new label is more specific
  const existing = map.get(id)
  if (!existing || (existing.label === id && label !== id)) {
    map.set(id, { label, shape })
  }
}

// ─── Auto Layout ────────────────────────────────────────────────────

function layoutNodes(
  nodeIds: string[],
  edgeList: { source: string; target: string }[],
  direction: Direction,
): { positions: Map<string, { x: number; y: number }> } {
  // Build adjacency for topological sorting
  const inDeg = new Map<string, number>()
  const adj = new Map<string, string[]>()
  for (const id of nodeIds) {
    inDeg.set(id, 0)
    adj.set(id, [])
  }
  for (const e of edgeList) {
    adj.get(e.source)?.push(e.target)
    inDeg.set(e.target, (inDeg.get(e.target) ?? 0) + 1)
  }

  // BFS topological sort → assign layers
  const queue = nodeIds.filter((id) => (inDeg.get(id) ?? 0) === 0)
  const layer = new Map<string, number>()
  const visited = new Set<string>()
  for (const id of queue) {
    layer.set(id, 0)
  }
  let qi = 0
  while (qi < queue.length) {
    const u = queue[qi++]
    visited.add(u)
    const uLayer = layer.get(u) ?? 0
    for (const v of adj.get(u) ?? []) {
      const newLayer = uLayer + 1
      layer.set(v, Math.max(layer.get(v) ?? 0, newLayer))
      inDeg.set(v, (inDeg.get(v) ?? 0) - 1)
      if ((inDeg.get(v) ?? 0) <= 0 && !visited.has(v) && !queue.includes(v)) {
        queue.push(v)
      }
    }
  }
  // Handle any unvisited (cyclic) nodes
  for (const id of nodeIds) {
    if (!visited.has(id)) {
      layer.set(id, 0)
      queue.push(id)
    }
  }

  // Group nodes by layer
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

  const isHorizontal = direction === 'LR' || direction === 'RL'
  const isReverse = direction === 'RL' || direction === 'BT'
  const maxLayer = Math.max(...Array.from(layers.keys()), 0)

  const positions = new Map<string, { x: number; y: number }>()
  const sortedLayers = Array.from(layers.entries()).sort((a, b) => a[0] - b[0])

  for (const [l, ids] of sortedLayers) {
    const layerIdx = isReverse ? maxLayer - l : l
    for (let i = 0; i < ids.length; i++) {
      // Center the layer vertically/horizontally
      const offset = (i - (ids.length - 1) / 2)
      if (isHorizontal) {
        positions.set(ids[i], {
          x: layerIdx * (NODE_W + GAP_X),
          y: 250 + offset * (NODE_H + GAP_Y),
        })
      } else {
        positions.set(ids[i], {
          x: 400 + offset * (NODE_W + GAP_X),
          y: layerIdx * (NODE_H + GAP_Y),
        })
      }
    }
  }

  return { positions }
}

// ─── Icon Guesser ───────────────────────────────────────────────────

const ICON_MAP: [RegExp, string][] = [
  [/user|用户|客户/i, 'user'],
  [/llm|gpt|model|模型|ai/i, 'brain'],
  [/agent|助手/i, 'cpu'],
  [/memory|记忆|缓存|cache/i, 'message'],
  [/tool|工具/i, 'wrench'],
  [/知识|knowledge|rag|doc/i, 'book'],
  [/数据|data|db|database|sql/i, 'database'],
  [/api|接口|服务|service|server/i, 'globe'],
  [/file|文件|存储|storage/i, 'folder'],
  [/output|输出|结果|result/i, 'clipboard'],
  [/input|输入|请求|request/i, 'send'],
  [/search|搜索|查询/i, 'globe'],
  [/email|邮件|mail/i, 'message'],
  [/auth|认证|登录|login/i, 'lock'],
  [/pay|支付|payment/i, 'clipboard'],
  [/image|图片|图像|视频|video/i, 'image'],
  [/code|代码|开发|dev/i, 'gear'],
  [/test|测试/i, 'gear'],
  [/deploy|部署|发布/i, 'rocket'],
  [/monitor|监控|日志|log/i, 'clipboard'],
  [/config|配置|设置/i, 'settings'],
  [/gateway|网关|路由|route/i, 'network'],
  [/queue|队列|消息|message/i, 'message'],
  [/cloud|云/i, 'globe'],
]

function guessIcon(label: string): string {
  for (const [re, icon] of ICON_MAP) {
    if (re.test(label)) return icon
  }
  return 'box'
}
