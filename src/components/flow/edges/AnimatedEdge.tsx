import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  type Edge,
  getSmoothStepPath,
  getBezierPath,
  useReactFlow,
} from '@xyflow/react'
import { useState } from 'react'

export type AnimatedEdgeData = {
  label?: string
  color?: string
  speed?: 'slow' | 'normal' | 'fast'
  particleCount?: number
  pathType?: 'bezier' | 'smoothstep'
  offset?: number
}

const speedMap = { slow: '3s', normal: '1.8s', fast: '1s' }

export function AnimatedFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  selected,
}: EdgeProps<Edge<AnimatedEdgeData>>) {
  const { setEdges } = useReactFlow()
  const [editing, setEditing] = useState(false)
  const color = data?.color ?? '#3b82f6'
  const speed = speedMap[data?.speed ?? 'normal']
  const particleCount = data?.particleCount ?? 3
  const pathType = data?.pathType ?? 'smoothstep'
  const edgeOffset = data?.offset ?? 25

  const saveLabel = (val: string) => {
    setEdges((eds) =>
      eds.map((e) =>
        e.id === id ? { ...e, data: { ...e.data, label: val.trim() || undefined } } : e,
      ),
    )
    setEditing(false)
  }

  const [edgePath, labelX, labelY] =
    pathType === 'bezier'
      ? getBezierPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
        })
      : getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
          borderRadius: 20,
          offset: edgeOffset,
        })

  return (
    <>
      {/* Base path - subtle background */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: 2,
          opacity: 0.25,
        }}
      />

      {/* Animated dashed overlay */}
      <path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeDasharray="8 6"
        className="animated-edge-dash"
        style={{
          animationDuration: speed,
        }}
      />

      {/* Flowing particles */}
      {Array.from({ length: particleCount }).map((_, i) => (
        <circle key={i} r={3.5} fill={color} filter={`url(#glow-${id})`}>
          <animateMotion
            dur={speed}
            repeatCount="indefinite"
            path={edgePath}
            begin={`${(i / particleCount) * parseFloat(speed)}s`}
          />
        </circle>
      ))}

      {/* Glow filter for particles */}
      <defs>
        <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Edge label — rendered as HTML via EdgeLabelRenderer so it supports real inputs */}
      <EdgeLabelRenderer>
        <div
          className={`edge-label-anchor nodrag nopan${selected || data?.label ? ' visible' : ''}`}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          onDoubleClick={(e) => { e.stopPropagation(); setEditing(true) }}
        >
          {editing ? (
            <input
              className="edge-label-input"
              style={{ borderColor: color, color }}
              defaultValue={data?.label ?? ''}
              autoFocus
              placeholder="添加标注..."
              onBlur={(e) => saveLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                if (e.key === 'Escape') setEditing(false)
                e.stopPropagation()
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              className={`edge-label-display${data?.label ? ' has-label' : ' empty-label'}`}
              style={data?.label ? { borderColor: color, color } : {}}
              title="双击添加标注"
            >
              {data?.label ?? '+'}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

