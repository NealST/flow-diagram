import { type NodeProps, type Node } from '@xyflow/react'

export type GroupNodeData = {
  label: string
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'gray'
}

const colorMap = {
  blue: { bg: 'rgba(219,234,254,0.4)', border: '#93c5fd', text: '#1e40af' },
  green: { bg: 'rgba(220,252,231,0.4)', border: '#86efac', text: '#166534' },
  orange: { bg: 'rgba(255,237,213,0.4)', border: '#fdba74', text: '#9a3412' },
  purple: { bg: 'rgba(243,232,255,0.4)', border: '#c084fc', text: '#6b21a8' },
  gray: { bg: 'rgba(243,244,246,0.5)', border: '#d1d5db', text: '#374151' },
}

export function GroupNode({ data }: NodeProps<Node<GroupNodeData>>) {
  const scheme = colorMap[data.color ?? 'gray']

  return (
    <div
      className="group-node"
      style={{
        background: scheme.bg,
        borderColor: scheme.border,
        width: '100%',
        height: '100%',
      }}
    >
      <div className="group-node-label" style={{ color: scheme.text }}>
        {data.label}
      </div>
    </div>
  )
}
