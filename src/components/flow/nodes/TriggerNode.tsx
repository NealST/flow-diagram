import { useState } from 'react'
import { Handle, Position, type NodeProps, type Node, useReactFlow } from '@xyflow/react'
import { NodeIcon } from '../icons'
import { NodeStylePopover, TRIGGER_COLORS, TRIGGER_ICONS } from './NodeStylePopover'
import { hexToScheme } from './colorUtils'

export type TriggerNodeData = {
  label: string
  event?: string
  icon?: string
  color?: string
}

const colorMap = {
  teal:   { bg: 'linear-gradient(135deg,#e6faf9 0%,#cde9e5 100%)', border: '#2ba3a0', accent: '#2ba3a0', text: '#184e4c' },
  orange: { bg: 'linear-gradient(135deg,#fff4ec 0%,#ffdec8 100%)', border: '#c07830', accent: '#c07830', text: '#5a2e00' },
  purple: { bg: 'linear-gradient(135deg,#f5f2ff 0%,#e4d8ff 100%)', border: '#7050a0', accent: '#7050a0', text: '#3a1a6c' },
  blue:   { bg: 'linear-gradient(135deg,#eff6ff 0%,#d4e8ff 100%)', border: '#3b7dc0', accent: '#3b7dc0', text: '#1a3a6c' },
}

export function TriggerNode({ id, data }: NodeProps<Node<TriggerNodeData>>) {
  const { updateNodeData } = useReactFlow()
  const c = data.color ?? 'teal'
  const namedScheme = c in colorMap ? colorMap[c as keyof typeof colorMap] : null
  const scheme = namedScheme ?? (() => {
    const s = hexToScheme(c)
    return {
      bg: `linear-gradient(135deg, ${s.bg} 0%, ${s.border}55 100%)`,
      border: s.border,
      accent: s.iconStroke,
      text: s.text,
    }
  })()
  const [editingLabel, setEditingLabel] = useState(false)
  const [editingEvent, setEditingEvent] = useState(false)

  return (
    <div
      className="trigger-node"
      style={{ background: scheme.bg, borderColor: scheme.border }}
    >
      <Handle type="target" position={Position.Top} className="flow-handle" />
      <Handle type="target" position={Position.Left} id="left" className="flow-handle" />

      <div className="trigger-node-icon" style={{ background: scheme.border + '22', color: scheme.accent }}>
        <NodeIcon icon={data.icon ?? 'zap'} size={14} />
      </div>

      <div className="trigger-node-content">
        {editingLabel ? (
          <input
            className="trigger-node-label-input"
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
            className="trigger-node-label"
            style={{ color: scheme.text }}
            onDoubleClick={(e) => { e.stopPropagation(); setEditingLabel(true) }}
            title="双击编辑名称"
          >
            {data.label || '触发器'}
          </div>
        )}

        {editingEvent ? (
          <input
            className="trigger-node-event-input"
            defaultValue={data.event}
            style={{ color: scheme.accent, borderColor: scheme.border }}
            autoFocus
            placeholder="事件名称"
            onBlur={(e) => {
              updateNodeData(id, { event: e.target.value })
              setEditingEvent(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') setEditingEvent(false)
              e.stopPropagation()
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="trigger-node-event"
            style={{ color: scheme.accent }}
            onDoubleClick={(e) => { e.stopPropagation(); setEditingEvent(true) }}
            title="双击编辑事件"
          >
            {data.event || 'on:start'}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="flow-handle" />
      <Handle type="source" position={Position.Right} id="right" className="flow-handle" />

      <NodeStylePopover
        color={data.color ?? 'teal'}
        icon={data.icon ?? 'zap'}
        colors={TRIGGER_COLORS}
        icons={TRIGGER_ICONS}
        onColorChange={(c) => updateNodeData(id, { color: c })}
        onIconChange={(ic) => updateNodeData(id, { icon: ic })}
      />
    </div>
  )
}
