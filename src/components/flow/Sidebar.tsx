import { type DragEvent, useState } from 'react'
import { NodeIcon } from './icons'

type NodeTemplate = {
  type: string
  nodeType: string
  label: string
  icon: string
  color: string
  description: string
  defaultData?: Record<string, unknown>
}

const nodeTemplates: NodeTemplate[] = [
  // ── 角色类 ──────────────────────────────────────────────
  {
    type: 'role', nodeType: 'roleNode',
    label: '角色 / Actor', icon: 'user', color: 'blue',
    description: '用户、系统、服务',
  },
  {
    type: 'role', nodeType: 'roleNode',
    label: 'AI 模型', icon: 'brain', color: 'purple',
    description: 'LLM, Agent',
  },
  {
    type: 'role', nodeType: 'roleNode',
    label: '工具 / Tool', icon: 'wrench', color: 'orange',
    description: 'API, 数据库, 文件',
  },
  {
    type: 'role', nodeType: 'roleNode',
    label: '数据源', icon: 'database', color: 'green',
    description: 'Database, Storage',
  },
  // ── 流程类 ──────────────────────────────────────────────
  {
    type: 'process', nodeType: 'processNode',
    label: '流程 / Process', icon: 'gear', color: 'blue',
    description: '处理步骤',
    defaultData: { steps: ['步骤 1'] },
  },
  {
    type: 'group', nodeType: 'groupNode',
    label: '分组 / Group', icon: 'box', color: 'gray',
    description: '逻辑分组容器',
  },
  // ── 新增节点 ────────────────────────────────────────────
  {
    type: 'trigger', nodeType: 'triggerNode',
    label: '触发 / Trigger', icon: 'zap', color: 'teal',
    description: '事件起点',
    defaultData: { event: 'on:start' },
  },
  {
    type: 'decision', nodeType: 'decisionNode',
    label: '判断 / Decision', icon: 'diamond', color: 'amber',
    description: '条件分支',
    defaultData: { trueLabel: 'Y', falseLabel: 'N' },
  },
  {
    type: 'text', nodeType: 'textNode',
    label: '笔记 / Note', icon: 'filetext', color: 'yellow',
    description: '可编辑文本卡片',
    defaultData: { body: '' },
  },
  {
    type: 'api', nodeType: 'apiNode',
    label: 'API 接口', icon: 'link', color: 'blue',
    description: 'REST 接口节点',
    defaultData: { method: 'GET', endpoint: '/api/endpoint' },
  },
  {
    type: 'image', nodeType: 'imageNode',
    label: '图片 / Image', icon: 'image', color: 'gray',
    description: '插入图片或 Logo',
    defaultData: {},
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggleGroup = (title: string) =>
    setCollapsed(prev => ({ ...prev, [title]: !prev[title] }))

  const onDragStart = (event: DragEvent<HTMLDivElement>, template: NodeTemplate) => {
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({
        type: template.nodeType,
        data: {
          label: template.label,
          icon: template.icon,
          color: template.color,
          description: '',
          ...template.defaultData,
        },
      }),
    )
    event.dataTransfer.effectAllowed = 'move'
  }

  // Group templates by category
  const roleTemplates = nodeTemplates.filter(t => t.type === 'role')
  const flowTemplates = nodeTemplates.filter(t => ['process', 'group'].includes(t.type))
  const extraTemplates = nodeTemplates.filter(t => ['trigger', 'decision', 'text', 'api', 'image'].includes(t.type))

  const renderGroup = (title: string, items: NodeTemplate[], startIdx: number) => {
    const isCollapsed = collapsed[title]
    return (
      <div className="flow-sidebar-group" key={title}>
        <button
          className="flow-sidebar-group-title"
          onClick={() => toggleGroup(title)}
          aria-expanded={!isCollapsed}
        >
          <span>{title}</span>
          <svg
            className="flow-sidebar-group-chevron"
            data-collapsed={isCollapsed}
            width="10" height="10" viewBox="0 0 10 10"
            fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="2,3.5 5,6.5 8,3.5" />
          </svg>
        </button>
        <div className="flow-sidebar-group-body" data-collapsed={isCollapsed}>
          <div className="flow-sidebar-group-body-inner">
          {items.map((template, i) => (
            <div
              key={template.nodeType + template.label}
              className="flow-sidebar-node"
              style={{ '--index': startIdx + i } as React.CSSProperties}
              draggable
              onDragStart={(e) => onDragStart(e, template)}
            >
              <span className="flow-sidebar-node-icon"><NodeIcon icon={template.icon} size={18} /></span>
              <div>
                <div className="flow-sidebar-node-label">{template.label}</div>
                <div className="flow-sidebar-node-desc">{template.description}</div>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flow-sidebar">
      <div className="flow-sidebar-header">
        <h3>组件面板</h3>
        <p>拖拽到画布中</p>
      </div>

      <div className="flow-sidebar-nodes">
        {renderGroup('角色', roleTemplates, 0)}
        {renderGroup('流程', flowTemplates, roleTemplates.length)}
        {renderGroup('扩展', extraTemplates, roleTemplates.length + flowTemplates.length)}
      </div>

      <div className="flow-sidebar-tips">
        <h4>操作提示</h4>
        <ul>
          <li>拖拽节点到画布创建</li>
          <li>双击节点内容编辑</li>
          <li>从端口拖出连接线</li>
          <li>滚轮缩放画布</li>
          <li>选中后 Delete 删除</li>
        </ul>
      </div>
    </div>
  )
}
