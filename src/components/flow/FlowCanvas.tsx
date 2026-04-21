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
import { TextNode } from './nodes/TextNode'
import { DecisionNode } from './nodes/DecisionNode'
import { TriggerNode } from './nodes/TriggerNode'
import { ApiNode } from './nodes/ApiNode'
import { ImageNode } from './nodes/ImageNode'
import { AnimatedFlowEdge } from './edges/AnimatedEdge'
import { Sidebar } from './Sidebar'
import { ExportPanel } from './ExportPanel'
import { AIChatPanel } from './AITweakPanel'
import { SparkleIcon } from './icons'
import ThemeToggle from '../ThemeToggle'
import { demoNodes, demoEdges } from './demoData'

const nodeTypes: NodeTypes = {
  roleNode: RoleNode,
  processNode: ProcessNode,
  groupNode: GroupNode,
  textNode: TextNode,
  decisionNode: DecisionNode,
  triggerNode: TriggerNode,
  apiNode: ApiNode,
  imageNode: ImageNode,
}

const edgeTypes: EdgeTypes = {
  animatedEdge: AnimatedFlowEdge,
}

let nodeId = 100

export function FlowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const headerActionsRef = useRef<HTMLDivElement>(null)
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
    <div className="flow-app">
      {/* App header — owns logo, export actions, AI toggle, theme */}
      <header className="flow-app-header">
        <div className="flow-app-header-brand">
          <div className="flow-app-header-logo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="16" y="16" width="6" height="6" rx="1" />
              <rect x="2" y="16" width="6" height="6" rx="1" />
              <rect x="9" y="2" width="6" height="6" rx="1" />
              <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
              <path d="M12 12V8" />
            </svg>
          </div>
          <span className="flow-app-header-name">FlowCraft</span>
          <span className="flow-app-header-badge">BETA</span>
        </div>

        <div className="flow-app-header-actions">
          {/* Primary tool group: Export + AI — share a segment pill */}
          <div className="flow-header-tool-group">
            <div ref={headerActionsRef} className="flow-header-export-slot" />
            <div className="flow-header-tool-sep" />
            <button
              className="flow-header-ai-btn"
              onClick={() => setChatOpen((v) => !v)}
              title="AI 助手"
              data-active={chatOpen}
            >
              <SparkleIcon size={14} />
              <span>AI</span>
            </button>
          </div>

          {/* Utility: theme toggle */}
          <ThemeToggle />
        </div>
      </header>

      {/* Editor */}
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
            <ExportPanel canvasRef={reactFlowWrapper} headerActionsRef={headerActionsRef} />
          </ReactFlow>
        </div>
        <AIChatPanel
          open={chatOpen}
          onToggle={() => setChatOpen((v) => !v)}
          onApply={handleAIApply}
        />
      </div>
    </div>
  )
}
