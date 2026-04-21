import { useState } from 'react'
import { type NodeProps, type Node, useReactFlow } from '@xyflow/react'
import { NodeStylePopover, GROUP_COLORS } from './NodeStylePopover'
import { hexToScheme } from './colorUtils'

export type GroupNodeData = {
  label: string
  color?: string
  number?: number
}

const colorMap = {
  blue: { bg: 'rgba(219,234,254,0.4)', border: '#93c5fd', text: '#1e40af' },
  green: { bg: 'rgba(220,252,231,0.4)', border: '#86efac', text: '#166534' },
  orange: { bg: 'rgba(255,237,213,0.4)', border: '#fdba74', text: '#9a3412' },
  purple: { bg: 'rgba(243,232,255,0.4)', border: '#c084fc', text: '#6b21a8' },
  gray: { bg: 'rgba(243,244,246,0.5)', border: '#d1d5db', text: '#374151' },
}

export function GroupNode({ id, data }: NodeProps<Node<GroupNodeData>>) {
  const { updateNodeData } = useReactFlow()
  const c = data.color ?? 'gray'
  const rawScheme = c in colorMap ? colorMap[c as keyof typeof colorMap] : hexToScheme(c)
  const scheme = {
    ...rawScheme,
    // Keep GroupNode bg translucent for custom hex colors
    bg: c.startsWith('#') ? `${c}1e` : rawScheme.bg,
  }
  const [editing, setEditing] = useState(false)

  // Cycle badge: undefined → 1 → 2 … 9 → undefined
  const cycleBadge = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = data.number === undefined ? 1 : data.number >= 9 ? undefined : data.number + 1
    updateNodeData(id, { number: next })
  }

  return (
    <div
      className="group-node"
      style={{ background: scheme.bg, borderColor: scheme.border, width: '100%', height: '100%' }}
    >
      {/* Number badge — top-left corner, click to cycle 1-9 or clear */}
      <div
        className={`group-node-badge nodrag nopan${data.number ? ' visible' : ''}`}
        style={{ background: scheme.border, color: scheme.text }}
        onClick={cycleBadge}
        title={data.number ? '点击更改编号' : '点击添加区块编号'}
      >
        {data.number ?? '+'}
      </div>
      {editing ? (
        <input
          className="group-node-label-input"
          defaultValue={data.label}
          style={{ color: scheme.text, borderColor: scheme.border }}
          autoFocus
          onBlur={(e) => { updateNodeData(id, { label: e.target.value }); setEditing(false) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            if (e.key === 'Escape') setEditing(false)
            e.stopPropagation()
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="group-node-label"
          style={{ color: scheme.text }}
          onDoubleClick={(e) => { e.stopPropagation(); setEditing(true) }}
          title="双击编辑标签"
        >
          {data.label}
        </div>
      )}

      <NodeStylePopover
        color={data.color ?? 'gray'}
        colors={GROUP_COLORS}
        onColorChange={(c) => updateNodeData(id, { color: c })}
      />
    </div>
  )
}
