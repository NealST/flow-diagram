import { useRef, useState } from 'react'
import { Handle, Position, type NodeProps, type Node, useReactFlow } from '@xyflow/react'
import { FileTextIcon } from '../icons'
import { NodeStylePopover, TEXT_COLORS } from './NodeStylePopover'
import { hexToScheme } from './colorUtils'

export type TextNodeData = {
  label: string
  body?: string
  color?: string
}

const colorMap = {
  yellow: { bg: '#fffbe6', border: '#e6d08a', accent: '#b8960a', text: '#5c4a00' },
  blue:   { bg: '#f0f6ff', border: '#a8c5e2', accent: '#3b7dc0', text: '#1e3a5c' },
  green:  { bg: '#f0f7f2', border: '#a3d4ad', accent: '#3a8f4f', text: '#1a4226' },
  pink:   { bg: '#fdf2f8', border: '#d8b0c8', accent: '#b05a8c', text: '#5a1e40' },
  gray:   { bg: '#f8f9fa', border: '#d1d5db', accent: '#6b7280', text: '#1f2937' },
}

export function TextNode({ id, data }: NodeProps<Node<TextNodeData>>) {
  const { updateNodeData } = useReactFlow()
  const c = data.color ?? 'yellow'
  const scheme = c in colorMap ? colorMap[c as keyof typeof colorMap] : hexToScheme(c)
  const [editingLabel, setEditingLabel] = useState(false)
  const [editingBody, setEditingBody] = useState(false)
  const labelRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  return (
    <div
      className="text-node"
      style={{ background: scheme.bg, borderColor: scheme.border }}
    >
      <Handle type="target" position={Position.Top} className="flow-handle" />
      <Handle type="target" position={Position.Left} id="left" className="flow-handle" />

      <div className="text-node-header" style={{ color: scheme.accent }}>
        <FileTextIcon size={12} />
        <span className="text-node-type">笔记</span>
      </div>

      {/* Editable title */}
      {editingLabel ? (
        <input
          ref={labelRef}
          className="text-node-label-input"
          defaultValue={data.label}
          style={{ color: scheme.text, borderColor: scheme.border }}
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
          className="text-node-label"
          style={{ color: scheme.text }}
          onDoubleClick={(e) => { e.stopPropagation(); setEditingLabel(true) }}
          title="双击编辑标题"
        >
          {data.label || '标题'}
        </div>
      )}

      {/* Editable body */}
      {editingBody ? (
        <textarea
          ref={bodyRef}
          className="text-node-body-input"
          defaultValue={data.body}
          style={{ color: scheme.text, borderColor: scheme.border }}
          autoFocus
          rows={3}
          onBlur={(e) => {
            updateNodeData(id, { body: e.target.value })
            setEditingBody(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setEditingBody(false)
            e.stopPropagation()
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="text-node-body"
          style={{ color: scheme.text + 'cc' }}
          onDoubleClick={(e) => { e.stopPropagation(); setEditingBody(true) }}
          title="双击编辑内容"
        >
          {data.body || <span className="text-node-placeholder">双击输入内容…</span>}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="flow-handle" />
      <Handle type="source" position={Position.Right} id="right" className="flow-handle" />

      <NodeStylePopover
        color={data.color ?? 'yellow'}
        colors={TEXT_COLORS}
        onColorChange={(c) => updateNodeData(id, { color: c })}
      />
    </div>
  )
}
