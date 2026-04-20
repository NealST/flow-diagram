import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type OnConnect,
  type NodeTypes,
  type EdgeTypes,
  BackgroundVariant,
  ConnectionMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useRef, useState, type DragEvent } from 'react'

import { RoleNode } from './nodes/RoleNode'
import { ProcessNode } from './nodes/ProcessNode'
import { GroupNode } from './nodes/GroupNode'
import { AnimatedFlowEdge } from './edges/AnimatedEdge'
import { Sidebar } from './Sidebar'
import { ExportPanel } from './ExportPanel'
import { AIChatPanel } from './AITweakPanel'
import { SparkleIcon } from './icons'
import { demoNodes, demoEdges } from './demoData'

const nodeTypes: NodeTypes = {
  roleNode: RoleNode,
  processNode: ProcessNode,
  groupNode: GroupNode,
}

const edgeTypes: EdgeTypes = {
  animatedEdge: AnimatedFlowEdge,
}

let nodeId = 100

export function FlowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(demoNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(demoEdges)
  const reactFlowInstance = useRef<any>(null)
  const [chatOpen, setChatOpen] = useState(false)

  const handleAIApply = useCallback(
    (newNodes: any[], newEdges: any[]) => {
      setNodes(newNodes)
      setEdges(newEdges)
      // Fit view after a tick to let nodes render
      requestAnimationFrame(() => {
        reactFlowInstance.current?.fitView({ padding: 0.2, duration: 400 })
      })
    },
    [setNodes, setEdges],
  )

  const onConnect: OnConnect = useCallback(
    (params) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'animatedEdge',
            data: { color: '#6a9fd4', speed: 'normal', pathType: 'smoothstep' },
          },
          eds,
        ),
      )
    },
    [setEdges],
  )

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      const raw = event.dataTransfer.getData('application/reactflow')
      if (!raw) return

      let parsed: { type: string; data: Record<string, unknown> }
      try {
        parsed = JSON.parse(raw)
      } catch {
        return
      }

      const bounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!bounds || !reactFlowInstance.current) return

      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      const newNode = {
        id: `node-${++nodeId}`,
        type: parsed.type,
        position,
        data: parsed.data as any,
        ...(parsed.type === 'groupNode'
          ? { style: { width: 300, height: 200 } }
          : {}),
      }

      setNodes((nds) => [...nds, newNode])
    },
    [setNodes],
  )

  return (
    <div className="flow-editor">
      <Sidebar />
      <div className="flow-canvas-wrapper" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onInit={(instance) => {
            reactFlowInstance.current = instance
          }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          defaultEdgeOptions={{
            type: 'animatedEdge',
            data: { color: '#6a9fd4', speed: 'normal' },
          }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          snapToGrid
          snapGrid={[20, 20]}
          minZoom={0.2}
          maxZoom={3}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1.5}
            color="var(--flow-grid-color, #e2e8f0)"
          />
          <Controls
            showInteractive
            className="flow-controls"
          />
          <MiniMap
            nodeStrokeWidth={3}
            className="flow-minimap"
            pannable
            zoomable
          />
          <ExportPanel canvasRef={reactFlowWrapper} />
        </ReactFlow>

        {/* AI Chat toggle button */}
        {!chatOpen && (
          <button
            className="chat-toggle-btn"
            onClick={() => setChatOpen(true)}
            title="AI 助手"
          >
            <SparkleIcon size={16} />
            <span>AI</span>
          </button>
        )}
      </div>
      <AIChatPanel
        open={chatOpen}
        onToggle={() => setChatOpen((v) => !v)}
        onApply={handleAIApply}
      />
    </div>
  )
}
