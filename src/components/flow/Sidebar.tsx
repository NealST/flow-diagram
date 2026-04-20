import { type DragEvent } from 'react'
import { NodeIcon } from './icons'

const nodeTemplates = [
  {
    type: 'role',
    label: '角色 / Actor',
    icon: 'user',
    color: 'blue',
    description: '用户、系统、服务',
  },
  {
    type: 'role',
    label: 'AI 模型',
    icon: 'brain',
    color: 'purple',
    description: 'LLM, Agent',
  },
  {
    type: 'role',
    label: '工具 / Tool',
    icon: 'wrench',
    color: 'orange',
    description: 'API, 数据库, 文件',
  },
  {
    type: 'role',
    label: '数据源',
    icon: 'database',
    color: 'green',
    description: 'Database, Storage',
  },
  {
    type: 'process',
    label: '流程 / Process',
    icon: 'gear',
    color: 'blue',
    description: '处理步骤',
  },
  {
    type: 'group',
    label: '分组 / Group',
    icon: 'box',
    color: 'gray',
    description: '逻辑分组容器',
  },
]

export function Sidebar() {
  const onDragStart = (event: DragEvent<HTMLDivElement>, template: (typeof nodeTemplates)[0]) => {
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({
        type: template.type === 'role' ? 'roleNode' : template.type === 'process' ? 'processNode' : 'groupNode',
        data: {
          label: template.label,
          icon: template.icon,
          color: template.color,
          description: '',
        },
      }),
    )
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="flow-sidebar">
      <div className="flow-sidebar-header">
        <h3>组件面板</h3>
        <p>拖拽到画布中</p>
      </div>

      <div className="flow-sidebar-nodes">
        {nodeTemplates.map((template, i) => (
          <div
            key={i}
            className="flow-sidebar-node"
            style={{ '--index': i } as React.CSSProperties}
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

      <div className="flow-sidebar-tips">
        <h4>操作提示</h4>
        <ul>
          <li>拖拽节点到画布创建</li>
          <li>从端口拖出连接线</li>
          <li>滚轮缩放画布</li>
          <li>选中后 Delete 删除</li>
        </ul>
      </div>
    </div>
  )
}
