import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'

export type ProcessNodeData = {
  label: string
  steps?: string[]
  color?: 'blue' | 'green' | 'orange' | 'purple'
}

const colorMap = {
  blue: { bg: '#f0f6ff', border: '#6a9fd4', accent: '#3b7dc0' },
  green: { bg: '#f0f7f2', border: '#5cad6e', accent: '#3a8f4f' },
  orange: { bg: '#fef6f0', border: '#d09050', accent: '#b47030' },
  purple: { bg: '#f5f2fa', border: '#9070c0', accent: '#7050a0' },
}

export function ProcessNode({ data }: NodeProps<Node<ProcessNodeData>>) {
  const scheme = colorMap[data.color ?? 'blue']

  return (
    <div
      className="process-node"
      style={{
        background: scheme.bg,
        borderColor: scheme.border,
      }}
    >
      <Handle type="target" position={Position.Top} className="flow-handle" />
      <Handle type="target" position={Position.Left} id="left" className="flow-handle" />

      <div
        className="process-node-header"
        style={{ background: scheme.border, color: '#fff' }}
      >
        {data.label}
      </div>

      {data.steps && data.steps.length > 0 && (
        <div className="process-node-steps">
          {data.steps.map((step, i) => (
            <div
              key={i}
              className="process-node-step"
              style={{ borderColor: scheme.border + '44' }}
            >
              <span
                className="process-node-step-num"
                style={{ background: scheme.accent, color: '#fff' }}
              >
                {i + 1}
              </span>
              {step}
            </div>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="flow-handle" />
      <Handle type="source" position={Position.Right} id="right" className="flow-handle" />
    </div>
  )
}
