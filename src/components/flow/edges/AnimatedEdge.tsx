import {
  BaseEdge,
  type EdgeProps,
  type Edge,
  getSmoothStepPath,
  getBezierPath,
} from '@xyflow/react'

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
}: EdgeProps<Edge<AnimatedEdgeData>>) {
  const color = data?.color ?? '#3b82f6'
  const speed = speedMap[data?.speed ?? 'normal']
  const particleCount = data?.particleCount ?? 3
  const pathType = data?.pathType ?? 'smoothstep'
  const edgeOffset = data?.offset ?? 25

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

      {/* Edge label */}
      {data?.label && (
        <foreignObject
          x={labelX - 50}
          y={labelY - 12}
          width={100}
          height={24}
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <div className="animated-edge-label" style={{ borderColor: color, color }}>
            {data.label}
          </div>
        </foreignObject>
      )}
    </>
  )
}
