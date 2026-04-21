import { useState } from 'react'
import { Handle, Position, type NodeProps, type Node, useReactFlow } from '@xyflow/react'
import { GlobeIcon } from '../icons'
import { NodeStylePopover, API_COLORS } from './NodeStylePopover'
import { hexToScheme } from './colorUtils'

export type ApiNodeData = {
  label: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  endpoint?: string
  color?: string
}

const methodColors: Record<string, { bg: string; text: string }> = {
  GET:    { bg: '#d1edd8', text: '#2a5a36' },
  POST:   { bg: '#d0e2f4', text: '#1e3a6c' },
  PUT:    { bg: '#f2dfcc', text: '#5a2e00' },
  DELETE: { bg: '#ecd4d4', text: '#5c1a1a' },
  PATCH:  { bg: '#ddd3ee', text: '#3a1a6c' },
}

const colorMap = {
  blue:   { bg: '#f0f6ff', border: '#a8c5e2', text: '#1e3a5c' },
  green:  { bg: '#f0f7f2', border: '#a3d4ad', text: '#1a4226' },
  orange: { bg: '#fef6f0', border: '#e0bf9e', text: '#5a2e00' },
  red:    { bg: '#faf2f2', border: '#d8a8a8', text: '#5c1a1a' },
}

const METHODS: ApiNodeData['method'][] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

export function ApiNode({ id, data }: NodeProps<Node<ApiNodeData>>) {
  const { updateNodeData } = useReactFlow()
  const c = data.color ?? 'blue'
  const scheme = c in colorMap ? colorMap[c as keyof typeof colorMap] : hexToScheme(c)
  const method = data.method ?? 'GET'
  const methodScheme = methodColors[method]
  const [editingLabel, setEditingLabel] = useState(false)
  const [editingEndpoint, setEditingEndpoint] = useState(false)

  const cycleMethod = (e: React.MouseEvent) => {
    e.stopPropagation()
    const idx = METHODS.indexOf(method)
    const next = METHODS[(idx + 1) % METHODS.length]
    updateNodeData(id, { method: next })
  }

  return (
    <div
      className="api-node"
      style={{ background: scheme.bg, borderColor: scheme.border }}
    >
      <Handle type="target" position={Position.Top} className="flow-handle" />
      <Handle type="target" position={Position.Left} id="left" className="flow-handle" />

      <div className="api-node-header">
        <div className="api-node-icon" style={{ color: scheme.text }}>
          <GlobeIcon size={13} />
        </div>

        {editingLabel ? (
          <input
            className="api-node-label-input"
            defaultValue={data.label}
            style={{ color: scheme.text }}
            autoFocus
            onBlur={(e) => {
              updateNodeData(id, { label: e.target.value })
              setEditingLabel(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') setEditingLabel(false)
              e.stopPropagation()
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="api-node-label"
            style={{ color: scheme.text }}
            onDoubleClick={(e) => { e.stopPropagation(); setEditingLabel(true) }}
            title="双击编辑名称"
          >
            {data.label || 'API'}
          </div>
        )}
      </div>

      <div className="api-node-request">
        {/* Method badge — click to cycle */}
        <button
          className="api-node-method"
          style={{ background: methodScheme.bg, color: methodScheme.text }}
          onClick={cycleMethod}
          title="点击切换请求方法"
        >
          {method}
        </button>

        {/* Endpoint — double-click to edit */}
        {editingEndpoint ? (
          <input
            className="api-node-endpoint-input"
            defaultValue={data.endpoint}
            style={{ color: scheme.text, borderColor: scheme.border }}
            autoFocus
            placeholder="/api/path"
            onBlur={(e) => {
              updateNodeData(id, { endpoint: e.target.value })
              setEditingEndpoint(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') setEditingEndpoint(false)
              e.stopPropagation()
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="api-node-endpoint"
            style={{ color: scheme.text + 'aa' }}
            onDoubleClick={(e) => { e.stopPropagation(); setEditingEndpoint(true) }}
            title="双击编辑路径"
          >
            {data.endpoint || '/api/endpoint'}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="flow-handle" />
      <Handle type="source" position={Position.Right} id="right" className="flow-handle" />

      <NodeStylePopover
        color={data.color ?? 'blue'}
        colors={API_COLORS}
        onColorChange={(c) => updateNodeData(id, { color: c })}
      />
    </div>
  )
}
