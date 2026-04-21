import { useRef, useState } from 'react'
import { Handle, Position, type NodeProps, type Node, useReactFlow } from '@xyflow/react'
import { NodeStylePopover, DECISION_COLORS } from './NodeStylePopover'
import { hexToScheme } from './colorUtils'

export type DecisionNodeData = {
  label: string
  trueLabel?: string
  falseLabel?: string
  color?: string
}

const colorMap = {
  amber:  { bg: '#fffbeb', border: '#d4a017', accent: '#b8850a', text: '#5c3d00', fill: 'rgba(255,235,170,0.9)' },
  blue:   { bg: '#f0f6ff', border: '#6a9fd4', accent: '#3b7dc0', text: '#1e3a5c', fill: 'rgba(219,234,254,0.9)' },
  red:    { bg: '#fdf2f2', border: '#d47070', accent: '#b54e4e', text: '#5c1a1a', fill: 'rgba(254,226,226,0.9)' },
  purple: { bg: '#f5f2fa', border: '#9070c0', accent: '#7050a0', text: '#3a1a6c', fill: 'rgba(237,233,254,0.9)' },
}

export function DecisionNode({ id, data }: NodeProps<Node<DecisionNodeData>>) {
  const { updateNodeData } = useReactFlow()
  const c = data.color ?? 'amber'
  const rawScheme = c in colorMap
    ? colorMap[c as keyof typeof colorMap]
    : (() => { const s = hexToScheme(c); return { bg: s.bg, border: s.border, accent: s.accent, text: s.text, fill: `${s.bg}e6` } })()
  const scheme = rawScheme
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const size = 130

  return (
    <div className="decision-node" style={{ width: size, height: size }}>
      {/* Diamond SVG background */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="decision-node-diamond"
        style={{ position: 'absolute', inset: 0 }}
      >
        <polygon
          points={`${size / 2},4 ${size - 4},${size / 2} ${size / 2},${size - 4} 4,${size / 2}`}
          fill={scheme.fill}
          stroke={scheme.border}
          strokeWidth="1.5"
        />
      </svg>

      {/* Center label */}
      <div className="decision-node-center">
        {editing ? (
          <input
            ref={inputRef}
            className="decision-node-input"
            defaultValue={data.label}
            style={{ color: scheme.text }}
            autoFocus
            onBlur={(e) => {
              updateNodeData(id, { label: e.target.value })
              setEditing(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') setEditing(false)
              e.stopPropagation()
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="decision-node-label"
            style={{ color: scheme.text }}
            onDoubleClick={(e) => { e.stopPropagation(); setEditing(true) }}
            title="双击编辑"
          >
            {data.label || '条件'}
          </div>
        )}
      </div>

      {/* Branch labels */}
      <div className="decision-node-true" style={{ color: scheme.accent }}>
        {data.trueLabel || 'Y'}
      </div>
      <div className="decision-node-false" style={{ color: '#b54e4e' }}>
        {data.falseLabel || 'N'}
      </div>

      <Handle type="target" position={Position.Top} className="flow-handle" />
      <Handle type="source" position={Position.Bottom} id="true" className="flow-handle" />
      <Handle type="source" position={Position.Right} id="false" className="flow-handle" />
      <Handle type="target" position={Position.Left} id="left" className="flow-handle" />

      <NodeStylePopover
        color={data.color ?? 'amber'}
        colors={DECISION_COLORS}
        onColorChange={(c) => updateNodeData(id, { color: c })}
      />
    </div>
  )
}
