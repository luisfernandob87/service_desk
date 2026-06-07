import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button, Space, Select, Tag, Typography, Drawer, Input } from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  BellOutlined,
  BranchesOutlined,
  StopOutlined,
  BugOutlined,
  ToolOutlined,
  SwapOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

const NODE_CONFIG = {
  start: {
    label: 'Inicio',
    color: '#52c41a',
    bg: '#f6ffed',
    icon: <PlayCircleOutlined />,
    hasTarget: false,
    hasSource: true,
    defaultData: {},
  },
  incident: {
    label: 'Incidente',
    color: '#ff4d4f',
    bg: '#fff2f0',
    icon: <BugOutlined />,
    hasTarget: true,
    hasSource: true,
    defaultData: { priority: 'medium' },
    configFields: [
      { name: 'assigned_group_id', label: 'Grupo asignado', type: 'groupSelect' },
      { name: 'assigned_user_id', label: 'Resolutor asignado', type: 'userSelect' },
      { name: 'priority', label: 'Prioridad', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
    ],
  },
  work_order: {
    label: 'Orden de Trabajo',
    color: '#722ed1',
    bg: '#f9f0ff',
    icon: <ToolOutlined />,
    hasTarget: true,
    hasSource: true,
    defaultData: { priority: 'medium' },
    configFields: [
      { name: 'assigned_group_id', label: 'Grupo asignado', type: 'groupSelect' },
      { name: 'assigned_user_id', label: 'Resolutor asignado', type: 'userSelect' },
      { name: 'priority', label: 'Prioridad', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
    ],
  },
  change_request: {
    label: 'Solicitud de Cambio',
    color: '#faad14',
    bg: '#fffbe6',
    icon: <SwapOutlined />,
    hasTarget: true,
    hasSource: true,
    defaultData: { priority: 'medium' },
    configFields: [
      { name: 'assigned_group_id', label: 'Grupo asignado', type: 'groupSelect' },
      { name: 'assigned_user_id', label: 'Resolutor asignado', type: 'userSelect' },
      { name: 'priority', label: 'Prioridad', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
    ],
  },
  problem: {
    label: 'Problema',
    color: '#fa541c',
    bg: '#fff7e6',
    icon: <ExclamationCircleOutlined />,
    hasTarget: true,
    hasSource: true,
    defaultData: { priority: 'medium' },
    configFields: [
      { name: 'assigned_group_id', label: 'Grupo asignado', type: 'groupSelect' },
      { name: 'assigned_user_id', label: 'Resolutor asignado', type: 'userSelect' },
      { name: 'priority', label: 'Prioridad', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
    ],
  },
  approval: {
    label: 'Aprobación',
    color: '#1677ff',
    bg: '#e6f4ff',
    icon: <CheckCircleOutlined />,
    hasTarget: true,
    hasSource: true,
    defaultData: { approver_type: 'manager' },
    configFields: [
      { name: 'assigned_user_id', label: 'Aprobador (persona)', type: 'userSelect' },
      { name: 'assigned_group_id', label: 'Grupo aprobador', type: 'groupSelect' },
    ],
  },
  notification: {
    label: 'Notificación',
    color: '#eb2f96',
    bg: '#fff0f6',
    icon: <BellOutlined />,
    hasTarget: true,
    hasSource: true,
    defaultData: { notify_type: 'in_app' },
    configFields: [
      { name: 'message', label: 'Mensaje', type: 'text' },
    ],
  },
  condition: {
    label: 'Condición',
    color: '#52c41a',
    bg: '#f6ffed',
    icon: <BranchesOutlined />,
    hasTarget: true,
    hasSource: true,
    defaultData: { field: 'status', operator: 'equals', value: 'resolved' },
    configFields: [
      { name: 'field', label: 'Campo', type: 'text' },
      { name: 'operator', label: 'Operador', type: 'select', options: ['equals', 'not_equals', 'contains'] },
      { name: 'value', label: 'Valor', type: 'text' },
    ],
  },
  end: {
    label: 'Fin',
    color: '#8c8c8c',
    bg: '#fafafa',
    icon: <StopOutlined />,
    hasTarget: true,
    hasSource: false,
    defaultData: {},
  },
};

function ProcessNode({ data, selected }) {
  const cfg = NODE_CONFIG[data.nodeType] || NODE_CONFIG.notification;
  const isCondition = data.nodeType === 'condition';
  return (
    <div style={{
      background: cfg.bg,
      border: `2px solid ${selected ? '#1677ff' : cfg.color}`,
      borderRadius: isCondition ? 4 : 8,
      padding: '8px 16px',
      minWidth: 140,
      textAlign: 'center',
      boxShadow: selected ? '0 0 0 2px rgba(22,119,255,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
      transform: isCondition ? 'rotate(45deg)' : 'none',
    }}>
      {cfg.hasTarget && <Handle type="target" position={Position.Top} style={{ background: cfg.color }} />}
      <div style={{ transform: isCondition ? 'rotate(-45deg)' : 'none' }}>
        <Space>
          {cfg.icon}
          <strong>{cfg.label}</strong>
        </Space>
        {data.label && <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{data.label}</div>}
      </div>
      {cfg.hasSource && <Handle type="source" position={Position.Bottom} style={{ background: cfg.color }} />}
      {data.nodeType === 'condition' && (
        <>
          <Handle type="source" position={Position.Left} id="true" style={{ background: '#52c41a', top: '75%' }} />
          <Handle type="source" position={Position.Right} id="false" style={{ background: '#ff4d4f', top: '75%' }} />
        </>
      )}
    </div>
  );
}

const nodeTypes = { process: ProcessNode };

const defaultEdgeOptions = {
  animated: true,
  style: { stroke: '#1677ff', strokeWidth: 2 },
};

export default function WorkflowEditor({ value, onChange }) {
  const [configNode, setConfigNode] = useState(null);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);

  const initialNodes = useMemo(() => {
    if (value?.nodes?.length) return value.nodes.map(n => ({ ...n, type: 'process' }));
    return [];
  }, [value?.nodes]);

  const initialEdges = useMemo(() => {
    if (value?.edges?.length) return value.edges;
    return [];
  }, [value?.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((params) => {
    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);
    if (!sourceNode || !targetNode) return;
    const srcCfg = NODE_CONFIG[sourceNode.data?.nodeType];
    const tgtCfg = NODE_CONFIG[targetNode.data?.nodeType];
    if (srcCfg?.hasSource === false || tgtCfg?.hasTarget === false) return;
    setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds));
  }, [nodes, setEdges]);

  const addNode = useCallback((nodeType) => {
    const cfg = NODE_CONFIG[nodeType];
    if (!cfg) return;
    const id = `${nodeType}_${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: 'process',
        position: { x: 100 + Math.random() * 400, y: 100 + Math.random() * 300 },
        data: { nodeType, ...cfg.defaultData },
      },
    ]);
  }, [setNodes]);

  const onNodeClick = useCallback(async (event, node) => {
    const cfg = NODE_CONFIG[node.data?.nodeType];
    if (!cfg?.configFields) return;
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [grpRes, usrRes] = await Promise.all([
        fetch(`${baseUrl}/api/support-groups`, { headers }),
        fetch(`${baseUrl}/api/users`, { headers }),
      ]);
      if (grpRes.ok) setGroups(await grpRes.json());
      if (usrRes.ok) setUsers(await usrRes.json());
    } catch (_) {}
    setConfigNode(node);
  }, []);

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n))
    );
  }, [setNodes]);

  const handleSave = () => {
    onChange({ nodes, edges });
  };

  const selectedNode = configNode ? nodes.find(n => n.id === configNode.id) : null;
  const cfg = selectedNode ? NODE_CONFIG[selectedNode.data?.nodeType] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <strong>Agregar paso:</strong>
        {Object.entries(NODE_CONFIG).map(([key, cfg]) => (
          <Tag
            key={key}
            color={cfg.color}
            style={{ cursor: 'pointer', padding: '2px 8px' }}
            onClick={() => addNode(key)}
          >
            + {cfg.label}
          </Tag>
        ))}
        <div style={{ flex: 1 }} />
        <Typography.Text type="secondary">{nodes.length} nodos, {edges.length} conexiones</Typography.Text>
        <Button type="primary" onClick={handleSave}>Guardar</Button>
      </div>
      <div style={{ flex: 1, minHeight: 400 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
      <Drawer
        title={`Configurar: ${cfg?.label || ''}`}
        open={!!selectedNode}
        onClose={() => setConfigNode(null)}
        width={360}
        key={selectedNode?.id || 'none'}
      >
        {selectedNode && cfg?.configFields && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {cfg.configFields.map((field) => {
              const curVal = selectedNode.data?.[field.name];
              if (field.type === 'select') {
                return (
                  <div key={field.name}>
                    <div style={{ marginBottom: 4, fontWeight: 500 }}>{field.label}</div>
                    <Select
                      style={{ width: '100%' }}
                      value={curVal}
                      onChange={(val) => updateNodeData(selectedNode.id, { [field.name]: val })}
                      options={field.options?.map(o => ({ label: o, value: o }))}
                    />
                  </div>
                );
              }
              if (field.type === 'groupSelect') {
                return (
                  <div key={field.name}>
                    <div style={{ marginBottom: 4, fontWeight: 500 }}>{field.label}</div>
                    <Select
                      style={{ width: '100%' }}
                      allowClear
                      placeholder="Seleccionar grupo"
                      value={curVal}
                      onChange={(val) => updateNodeData(selectedNode.id, { [field.name]: val })}
                      options={groups.map(g => ({ label: g.name, value: g.id }))}
                    />
                  </div>
                );
              }
              if (field.type === 'userSelect') {
                return (
                  <div key={field.name}>
                    <div style={{ marginBottom: 4, fontWeight: 500 }}>{field.label}</div>
                    <Select
                      style={{ width: '100%' }}
                      allowClear
                      placeholder="Seleccionar usuario"
                      value={curVal}
                      onChange={(val) => updateNodeData(selectedNode.id, { [field.name]: val })}
                      options={users.map(u => ({ label: u.full_name, value: u.id }))}
                    />
                  </div>
                );
              }
              if (field.type === 'text') {
                return (
                  <div key={field.name}>
                    <div style={{ marginBottom: 4, fontWeight: 500 }}>{field.label}</div>
                    <Input.TextArea
                      rows={3}
                      value={curVal || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { [field.name]: e.target.value })}
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}
      </Drawer>
    </div>
  );
}
