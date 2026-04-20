import type { Node, Edge } from '@xyflow/react'
import type { RoleNodeData } from './nodes/RoleNode'
import type { ProcessNodeData } from './nodes/ProcessNode'
import type { AnimatedEdgeData } from './edges/AnimatedEdge'

// Demo: AI Agent Collaboration Flow
export const demoNodes: Node<RoleNodeData | ProcessNodeData>[] = [
  // === Column 1: User ===
  {
    id: 'user',
    type: 'roleNode',
    position: { x: 60, y: 280 },
    data: {
      label: '用户 User',
      icon: 'user',
      color: 'blue',
      description: '发送请求',
    },
  },

  // === Column 2: AI Core ===
  {
    id: 'llm',
    type: 'roleNode',
    position: { x: 380, y: 80 },
    data: {
      label: 'LLM 大模型',
      icon: 'brain',
      color: 'purple',
      description: '理解 & 推理',
    },
  },
  {
    id: 'agent',
    type: 'processNode',
    position: { x: 380, y: 280 },
    data: {
      label: 'AI Agent',
      steps: ['规划 Plan', '执行 Execute', '交付 Deliver'],
      color: 'purple',
    },
  },

  // === Column 3: Capabilities ===
  {
    id: 'memory',
    type: 'roleNode',
    position: { x: 720, y: 40 },
    data: {
      label: '记忆 Memory',
      icon: 'message',
      color: 'teal',
      description: '上下文 & 历史',
    },
  },
  {
    id: 'tools',
    type: 'roleNode',
    position: { x: 720, y: 220 },
    data: {
      label: '工具 Tools',
      icon: 'wrench',
      color: 'orange',
      description: 'API / 搜索 / 代码',
    },
  },
  {
    id: 'knowledge',
    type: 'roleNode',
    position: { x: 720, y: 400 },
    data: {
      label: '知识库',
      icon: 'book',
      color: 'green',
      description: 'RAG / 文档',
    },
  },

  // === Column 4: Data Sources ===
  {
    id: 'database',
    type: 'roleNode',
    position: { x: 1040, y: 100 },
    data: {
      label: '数据库',
      icon: 'database',
      color: 'blue',
      description: 'PostgreSQL / Redis',
    },
  },
  {
    id: 'api',
    type: 'roleNode',
    position: { x: 1040, y: 300 },
    data: {
      label: '外部 API',
      icon: 'globe',
      color: 'pink',
      description: 'REST / GraphQL',
    },
  },
  {
    id: 'files',
    type: 'roleNode',
    position: { x: 1040, y: 500 },
    data: {
      label: '文件系统',
      icon: 'folder',
      color: 'red',
      description: '本地 / 云存储',
    },
  },

  // === Output ===
  {
    id: 'output',
    type: 'roleNode',
    position: { x: 180, y: 530 },
    data: {
      label: '结果输出',
      icon: 'clipboard',
      color: 'green',
      description: '响应 / 报告',
    },
  },
]

export const demoEdges: Edge<AnimatedEdgeData>[] = [
  // User → Agent (horizontal right)
  {
    id: 'e-user-agent',
    source: 'user',
    target: 'agent',
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'animatedEdge',
    data: { label: 'Prompt', color: '#6a9fd4', speed: 'normal', pathType: 'smoothstep' },
  },
  // Agent → LLM (vertical up)
  {
    id: 'e-agent-llm',
    source: 'agent',
    target: 'llm',
    sourceHandle: 'top',
    targetHandle: 'bottom',
    type: 'animatedEdge',
    data: { label: '推理请求', color: '#9070c0', speed: 'fast', pathType: 'smoothstep' },
  },
  // LLM → Memory (horizontal right)
  {
    id: 'e-llm-memory',
    source: 'llm',
    target: 'memory',
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'animatedEdge',
    data: { label: '读写记忆', color: '#2e9e93', speed: 'slow', pathType: 'smoothstep' },
  },
  // Agent → Tools (horizontal right)
  {
    id: 'e-agent-tools',
    source: 'agent',
    target: 'tools',
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'animatedEdge',
    data: { label: '调用工具', color: '#c07830', speed: 'normal', pathType: 'smoothstep', offset: 20 },
  },
  // Agent → Knowledge (horizontal right, routes down)
  {
    id: 'e-agent-knowledge',
    source: 'agent',
    target: 'knowledge',
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'animatedEdge',
    data: { label: '检索知识', color: '#3a8f4f', speed: 'normal', pathType: 'smoothstep', offset: 45 },
  },
  // Tools → Database (horizontal right)
  {
    id: 'e-tools-db',
    source: 'tools',
    target: 'database',
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'animatedEdge',
    data: { color: '#6a9fd4', speed: 'fast', pathType: 'smoothstep', offset: 20 },
  },
  // Tools → API (horizontal right, routes down)
  {
    id: 'e-tools-api',
    source: 'tools',
    target: 'api',
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'animatedEdge',
    data: { color: '#b05a7e', speed: 'normal', pathType: 'smoothstep', offset: 40 },
  },
  // Knowledge → Files (horizontal right)
  {
    id: 'e-knowledge-files',
    source: 'knowledge',
    target: 'files',
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'animatedEdge',
    data: { color: '#b54e4e', speed: 'slow', pathType: 'smoothstep' },
  },
  // Agent → Output (down then left)
  {
    id: 'e-agent-output',
    source: 'agent',
    target: 'output',
    sourceHandle: 'bottom',
    targetHandle: 'right',
    type: 'animatedEdge',
    data: { label: '返回结果', color: '#3a8f4f', speed: 'normal', pathType: 'smoothstep' },
  },
  // Output → User (up to user)
  {
    id: 'e-output-user',
    source: 'output',
    target: 'user',
    sourceHandle: 'top',
    targetHandle: 'bottom',
    type: 'animatedEdge',
    data: { label: 'Response', color: '#6a9fd4', speed: 'slow', pathType: 'smoothstep' },
  },
]
