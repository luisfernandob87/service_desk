import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Typography, Tag, Descriptions, Button, Spin, Space, Divider, Steps, Table } from 'antd';
import { ArrowLeftOutlined, BugOutlined, ToolOutlined, SwapOutlined, ExclamationCircleOutlined, CheckCircleOutlined, BellOutlined, BranchesOutlined, PlayCircleOutlined, StopOutlined, LinkOutlined } from '@ant-design/icons';
import api from '../../api/client';
import { TICKET_TYPES, TICKET_STATUS } from '../../utils/constants';
import { getOrderedNodes, getStepStatus } from '../../utils/workflowHelpers';
import { formatDate } from '../../utils/formatDate';

const NODE_ICONS = {
  start: <PlayCircleOutlined />,
  incident: <BugOutlined style={{ color: '#ff4d4f' }} />,
  work_order: <ToolOutlined style={{ color: '#722ed1' }} />,
  change_request: <SwapOutlined style={{ color: '#faad14' }} />,
  problem: <ExclamationCircleOutlined style={{ color: '#fa541c' }} />,
  approval: <CheckCircleOutlined style={{ color: '#1677ff' }} />,
  notification: <BellOutlined style={{ color: '#eb2f96' }} />,
  condition: <BranchesOutlined style={{ color: '#52c41a' }} />,
  end: <StopOutlined />,
};

const NODE_LABELS = {
  start: 'Inicio', incident: 'Incidente', work_order: 'Orden Trabajo',
  change_request: 'Solicitud Cambio', problem: 'Problema',
  approval: 'Aprobación', notification: 'Notificación',
  condition: 'Condición', end: 'Fin',
};

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exec, setExec] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/workflow-executions/${id}`);
        setExec(res.data);
      } catch { /* */ }
      finally { setLoading(false) }
    })();
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!exec) return <Typography.Text type="danger">Petición no encontrada</Typography.Text>;

  const ticketColumns = [
    { title: 'Código', dataIndex: 'code', key: 'code', render: (v, r) => <Link to={`/tickets/${r.id}`}>{v || `#${r.id}`}</Link> },
    { title: 'Tipo', dataIndex: 'type', key: 'type', render: (v) => <Tag>{TICKET_TYPES[v] || v}</Tag> },
    { title: 'Título', dataIndex: 'title', key: 'title' },
    { title: 'Estado', dataIndex: 'status', key: 'status', render: (v) => <Tag>{TICKET_STATUS[v] || v}</Tag> },
    { title: 'Resolución', dataIndex: 'resolution', key: 'resolution', render: (v) => v || '-' },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/support/peticiones')} style={{ marginBottom: 16 }}>Volver</Button>
      <Card>
        <Space>
          <Typography.Title level={4} style={{ margin: 0 }}>Petición #{exec.request_number}</Typography.Title>
          <Tag color={exec.status === 'completed' ? 'green' : exec.status === 'closed' ? 'default' : exec.status === 'cancelled' ? 'red' : exec.status === 'on_hold' ? 'gold' : 'blue'}>
            {exec.status === 'active' ? 'Activo' : exec.status === 'on_hold' ? 'En Espera' : exec.status === 'completed' ? 'Completado' : exec.status === 'closed' ? 'Cerrado' : 'Cancelado'}
          </Tag>
        </Space>

        <Descriptions column={2} size="small" bordered style={{ marginTop: 16 }}>
          <Descriptions.Item label="Servicio">{exec.service?.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Solicitante">{exec.requester?.full_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Grupo asignado">{exec.assignedGroup?.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Workflow">{exec.workflow?.name || '-'}</Descriptions.Item>
          {exec.parentExecution && (
            <Descriptions.Item label="Reapertura de" span={2}>
              <Link to={`/support/peticiones/${exec.parentExecution.id}`}>
                <LinkOutlined /> Petición #{exec.parentExecution.request_number || exec.parentExecution.id}
              </Link>
            </Descriptions.Item>
          )}
          {exec.childExecutions?.length > 0 && (
            <Descriptions.Item label="Reabierta como" span={2}>
              {(exec.childExecutions || []).map(child => (
                <div key={child.id}>
                  <Link to={`/support/peticiones/${child.id}`}>
                    <LinkOutlined /> Petición #{child.request_number || child.id}
                  </Link>
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    {child.status === 'active' ? 'Activo' : child.status === 'completed' ? 'Completado' : child.status}
                  </Tag>
                </div>
              ))}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Iniciado">{formatDate(exec.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="Completado">{exec.completed_at ? formatDate(exec.completed_at) : '-'}</Descriptions.Item>
        </Descriptions>

        <Divider>Datos del Formulario</Divider>
        {exec.context?.form_data && Object.keys(exec.context.form_data).length > 0 ? (
          Object.entries(exec.context.form_data).map(([k, v]) => (
            <div key={k}><strong>{k}:</strong> {typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>
          ))
        ) : (
          <Typography.Text type="secondary">Sin datos adicionales</Typography.Text>
        )}

        <Divider>Flujo de Trabajo</Divider>
        <Steps
          direction="vertical"
          size="small"
          current={-1}
          items={(() => {
            const orderedNodes = getOrderedNodes(exec.workflow?.nodes || [], exec.workflow?.edges || []);
            return orderedNodes
              .filter(n => n.data?.nodeType !== 'start')
              .map(node => {
                const status = getStepStatus(node, exec, orderedNodes);
                const ticketNode = (exec.tickets || []).find(t => t.source_node_id === node.id);
                const isCondition = node.data?.nodeType === 'condition';
                const isApproval = node.data?.nodeType === 'approval';
                const isNotification = node.data?.nodeType === 'notification';
                const isEnd = node.data?.nodeType === 'end';
                const isWaiting = status === 'wait';

                return {
                  title: (
                    <Space>
                      {NODE_ICONS[node.data?.nodeType]}
                      <span style={{ color: isWaiting ? '#bbb' : undefined }}>
                        {NODE_LABELS[node.data?.nodeType] || node.data?.label || node.data?.nodeType}
                      </span>
                      {node.data?.assigned_group_id && (
                        <Tag style={{ fontSize: 10 }}>Grupo: #{node.data.assigned_group_id}</Tag>
                      )}
                    </Space>
                  ),
                  status,
                  description: ticketNode ? (
                    <Link to={`/tickets/${ticketNode.id}`} style={{ fontSize: 12 }}>
                      {ticketNode.code || `#${ticketNode.id}`} - {ticketNode.title} ({TICKET_STATUS[ticketNode.status] || ticketNode.status})
                      {ticketNode.resolution && <div style={{ color: '#666', marginTop: 4 }}>Resolución: {ticketNode.resolution}</div>}
                    </Link>
                  ) : isEnd ? (
                    status === 'finish'
                      ? <span style={{ fontSize: 12, color: '#999' }}>Flujo finalizado</span>
                      : <span style={{ fontSize: 12, color: '#bbb' }}>Pendiente por ejecutar</span>
                  ) : isNotification ? (
                    status === 'finish'
                      ? <span style={{ fontSize: 12, color: '#999' }}>Notificación enviada</span>
                      : <span style={{ fontSize: 12, color: '#bbb' }}>Pendiente por ejecutar</span>
                  ) : isCondition ? (
                    status === 'finish'
                      ? <span style={{ fontSize: 12, color: '#999' }}>Condición evaluada</span>
                      : <span style={{ fontSize: 12, color: '#bbb' }}>Pendiente por ejecutar</span>
                  ) : isApproval ? (
                    status === 'wait'
                      ? <span style={{ fontSize: 12, color: '#bbb' }}>Pendiente por ejecutar</span>
                      : undefined
                  ) : undefined,
                };
              });
          })()}
        />

        <Divider>Tickets Generados</Divider>
        <Table dataSource={exec.tickets || []} columns={ticketColumns} rowKey="id" pagination={false} size="small" />
      </Card>
    </div>
  );
}
