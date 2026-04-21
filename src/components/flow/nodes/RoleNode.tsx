import { useState } from 'react'
import { Handle, Position, type NodeProps, type Node, useReactFlow } from '@xyflow/react'
import { NodeIcon } from '../icons'
import { NodeStylePopover, ROLE_COLORS, ROLE_ICONS } from './NodeStylePopover'
import { hexToScheme } from './colorUtils'

export type RoleNodeData = {
  label: string
  description?: string
  icon?: string
  color?: string
}

const colorMap = {
  blue: {
    bg: '#f0f6ff',
    border: '#a8c5e2',
    text: '#2b5278',
    iconBg: '#d0e2f4',
    iconStroke: '#3b7dc0',
  },
  green: {
    bg: '#f0f7f2',
    border: '#a3d4ad',
    text: '#2a5a36',
    iconBg: '#d1edd8',
    iconStroke: '#3a8f4f',
  },
  orange: {
    bg: '#fef6f0',
    border: '#e0bf9e',
    text: '#7a4d24',
    iconBg: '#f2dfcc',
    iconStroke: '#c07830',
  },
  purple: {
    bg: '#f5f2fa',
    border: '#c1b3da',
    text: '#5a3d82',
    iconBg: '#ddd3ee',
    iconStroke: '#7e5bb0',
  },
  pink: {
    bg: '#faf2f5',
    border: '#d8b0c0',
    text: '#7a3452',
    iconBg: '#edd4de',
    iconStroke: '#b05a7e',
  },
  teal: {
    bg: '#f0f8f7',
    border: '#9ecec8',
    text: '#235c55',
    iconBg: '#cde9e5',
    iconStroke: '#2e9e93',
  },
  red: {
    bg: '#faf2f2',
    border: '#d8a8a8',
    text: '#7a2e2e',
    iconBg: '#ecd4d4',
    iconStroke: '#b54e4e',
  },
}

export function RoleNode({ id, data }: NodeProps<Node<RoleNodeData>>) {
  const { updateNodeData } = useReactFlow()
  const c = data.color ?? 'blue'
  const scheme = c in colorMap ? colorMap[c as keyof typeof colorMap] : hexToScheme(c)
  const [editingLabel, setEditingLabel] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)

  return (
    <div
      className="role-node"
      style={{
        background: scheme.bg,
        borderColor: scheme.border,
        color: scheme.text,
      }}
    >
      <Handle type="target" position={Position.Top} className="flow-handle" />
      <Handle type="target" position={Position.Left} id="left" className="flow-handle" />

      {data.icon && (
        <div
          className="role-node-icon"
          style={{ background: scheme.iconBg, color: scheme.iconStroke }}
        >
          <NodeIcon icon={data.icon} size={16} />
        </div>
      )}

      <div className="role-node-content">
        {editingLabel ? (
          <input
            className="role-node-label-input"
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
            className="role-node-label"
            onDoubleClick={(e) => { e.stopPropagation(); setEditingLabel(true) }}
            title="双击编辑名称"
          >
            {data.label}
          </div>
        )}

        {editingDesc ? (
          <input
            className="role-node-desc-input"
            defaultValue={data.description}
            style={{ color: scheme.text }}
            autoFocus
            placeholder="描述..."
            onBlur={(e) => {
              updateNodeData(id, { description: e.target.value })
              setEditingDesc(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') setEditingDesc(false)
              e.stopPropagation()
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="role-node-desc"
            onDoubleClick={(e) => { e.stopPropagation(); setEditingDesc(true) }}
            title="双击编辑描述"
          >
            {data.description || <span style={{ opacity: 0.4 }}>双击添加描述</span>}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="flow-handle" />
      <Handle type="source" position={Position.Right} id="right" className="flow-handle" />

      <NodeStylePopover
        color={data.color ?? 'blue'}
        icon={data.icon}
        colors={ROLE_COLORS}
        icons={ROLE_ICONS}
        onColorChange={(c) => updateNodeData(id, { color: c })}
        onIconChange={(ic) => updateNodeData(id, { icon: ic })}
      />
    </div>
  )
}
