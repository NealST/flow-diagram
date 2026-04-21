import { useState } from 'react'
import { Handle, Position, type NodeProps, type Node, useReactFlow } from '@xyflow/react'
import { NodeStylePopover, PROCESS_COLORS } from './NodeStylePopover'
import { hexToScheme } from './colorUtils'

export type ProcessNodeData = {
  label: string
  steps?: string[]
  color?: string
}

const colorMap = {
  blue: { bg: '#f0f6ff', border: '#6a9fd4', accent: '#3b7dc0' },
  green: { bg: '#f0f7f2', border: '#5cad6e', accent: '#3a8f4f' },
  orange: { bg: '#fef6f0', border: '#d09050', accent: '#b47030' },
  purple: { bg: '#f5f2fa', border: '#9070c0', accent: '#7050a0' },
}

export function ProcessNode({ id, data }: NodeProps<Node<ProcessNodeData>>) {
  const { updateNodeData } = useReactFlow()
  const c = data.color ?? 'blue'
  const scheme = c in colorMap ? colorMap[c as keyof typeof colorMap] : hexToScheme(c)
  const [editingLabel, setEditingLabel] = useState(false)
  const [editingStep, setEditingStep] = useState<number | null>(null)
  const steps = data.steps ?? []

  const saveStep = (idx: number, value: string) => {
    const next = steps.map((s, i) => (i === idx ? value : s))
    updateNodeData(id, { steps: next })
    setEditingStep(null)
  }

  const addStep = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = [...steps, '新步骤']
    updateNodeData(id, { steps: next })
    setEditingStep(next.length - 1)
  }

  const removeStep = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation()
    updateNodeData(id, { steps: steps.filter((_, i) => i !== idx) })
  }

  return (
    <div
      className="process-node"
      style={{ background: scheme.bg, borderColor: scheme.border }}
    >
      <Handle type="target" position={Position.Top} className="flow-handle" />
      <Handle type="target" position={Position.Left} id="left" className="flow-handle" />

      {editingLabel ? (
        <input
          className="process-node-header-input"
          defaultValue={data.label}
          style={{ background: scheme.border }}
          autoFocus
          onBlur={(e) => { updateNodeData(id, { label: e.target.value }); setEditingLabel(false) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            if (e.key === 'Escape') setEditingLabel(false)
            e.stopPropagation()
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="process-node-header"
          style={{ background: scheme.border, color: '#fff' }}
          onDoubleClick={(e) => { e.stopPropagation(); setEditingLabel(true) }}
          title="双击编辑标题"
        >
          {data.label}
        </div>
      )}

      <div className="process-node-steps">
        {steps.map((step, i) => (
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
            {editingStep === i ? (
              <input
                className="process-node-step-input"
                defaultValue={step}
                autoFocus
                onBlur={(e) => saveStep(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  if (e.key === 'Escape') setEditingStep(null)
                  e.stopPropagation()
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="process-node-step-text"
                onDoubleClick={(e) => { e.stopPropagation(); setEditingStep(i) }}
                title="双击编辑"
              >
                {step}
              </span>
            )}
            <button
              className="process-node-step-del"
              onClick={(e) => removeStep(e, i)}
              title="删除步骤"
            >
              ×
            </button>
          </div>
        ))}
        <button className="process-node-add-step" onClick={addStep} style={{ color: scheme.accent }}>
          + 添加步骤
        </button>
      </div>

      <Handle type="source" position={Position.Bottom} className="flow-handle" />
      <Handle type="source" position={Position.Right} id="right" className="flow-handle" />

      <NodeStylePopover
        color={data.color ?? 'blue'}
        colors={PROCESS_COLORS}
        onColorChange={(c) => updateNodeData(id, { color: c })}
      />
    </div>
  )
}
