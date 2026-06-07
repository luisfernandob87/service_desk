import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Typography, Tag, Descriptions, Form, Input, Button, List, Spin, message, Space, Divider, Select, Steps } from 'antd';
import { ArrowLeftOutlined, SendOutlined, UploadOutlined, LinkOutlined, PlayCircleOutlined, CheckCircleOutlined, StopOutlined, BugOutlined, ToolOutlined, SwapOutlined, ExclamationCircleOutlined, BellOutlined, BranchesOutlined } from '@ant-design/icons';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { TICKET_TYPES, TICKET_STATUS, PRIORITIES } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import SlaTimer from '../../components/SlaTimer';

const { TextArea } = Input;

const statusColors = { new: 'blue', in_progress: 'orange', on_hold: 'gold', resolved: 'green', closed: 'default', cancelled: 'red' };
const typeColors = { incident: 'red', work_order: 'purple', change_request: 'gold', problem: 'volcano' };

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
  start: 'Inicio',
  incident: 'Incidente',
  work_order: 'Orden Trabajo',
  change_request: 'Solicitud Cambio',
  problem: 'Problema',
  approval: 'Aprobación',
  notification: 'Notificación',
  condition: 'Condición',
  end: 'Fin',
};

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [groups, setGroups] = useState([]);
  const [resolvers, setResolvers] = useState([]);
  const [commenting, setCommenting] = useState(false);
  const [execution, setExecution] = useState(null);
  const [resolution, setResolution] = useState('');

  const loadTicket = async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data);
      if (res.data.workflow_execution_id) {
        try {
          const exRes = await api.get(`/workflow-executions/by-ticket/${id}`);
          setExecution(exRes.data);
        } catch { /* ignore */ }
      }
    } catch { message.error('Error al cargar ticket'); navigate(-1) }
    finally { setLoading(false) }
  };

  useEffect(() => { loadTicket() }, [id]);

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    setCommenting(true);
    try {
      await api.post(`/tickets/${id}/comments`, { content: comment });
      setComment('');
      message.success('Comentario agregado');
      loadTicket();
    } catch { message.error('Error al agregar comentario') }
    finally { setCommenting(false) }
  };

  const handleChangeStatus = async (status) => {
    try {
      const payload = { status };
      if ((status === 'resolved' || status === 'closed') && resolution.trim()) {
        payload.resolution = resolution.trim();
      }
      await api.patch(`/tickets/${id}/status`, payload);
      setResolution('');
      message.success('Estado actualizado');
      loadTicket();
    } catch (err) { message.error(err.response?.data?.error || 'Error al actualizar estado') }
  };

  const handleAssign = async (field, value) => {
    try {
      await api.patch(`/tickets/${id}/assign`, { [field]: value });
      message.success('Asignación actualizada');
      loadTicket();
    } catch { message.error('Error al asignar') }
  };

  const handleAttach = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/tickets/${id}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      message.success('Archivo subido');
      loadTicket();
    } catch { message.error('Error al subir archivo') }
    e.target.value = '';
  };

  const loadGroups = async () => {
    try {
      const res = await api.get('/support-groups');
      setGroups(res.data);
      const allUsers = await api.get('/users');
      setResolvers(allUsers.data.filter(u => ['admin', 'manager', 'resolver'].includes(u.role)));
    } catch { /* ignore */ }
  };

  useEffect(() => { if (user && ['admin', 'manager', 'resolver'].includes(user.role)) loadGroups() }, [user]);

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!ticket) return null;

  const canManage = user && ['admin', 'manager', 'resolver'].includes(user.role);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>Volver</Button>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>{ticket.code || `#${ticket.id}`} {ticket.title}</Typography.Title>
          <Tag color={typeColors[ticket.type]}>{TICKET_TYPES[ticket.type]}</Tag>
          <Tag color={statusColors[ticket.status]}>{TICKET_STATUS[ticket.status]}</Tag>
        </Space>

        {canManage && (
          <div style={{ marginBottom: 16 }}>
            <Space wrap>
              <Select
                value={ticket.status}
                onChange={v => handleChangeStatus(v)}
                options={Object.entries(TICKET_STATUS).map(([k, v]) => ({ label: v, value: k }))}
                style={{ width: 150 }}
                size="small"
              />
              <Select
                placeholder="Asignar grupo"
                value={ticket.assigned_group_id || undefined}
                onChange={v => handleAssign('assigned_group_id', v)}
                options={groups.map(g => ({ label: g.name, value: g.id }))}
                allowClear
                style={{ width: 180 }}
                size="small"
              />
              <Select
                placeholder="Asignar usuario"
                value={ticket.assigned_user_id || undefined}
                onChange={v => handleAssign('assigned_user_id', v)}
                options={resolvers.map(u => ({ label: `${u.full_name} (${u.email})`, value: u.id }))}
                allowClear
                style={{ width: 220 }}
                size="small"
              />
              <Select
                value={ticket.priority}
                onChange={v => handleAssign('priority', v)}
                options={Object.entries(PRIORITIES).map(([k, v]) => ({ label: v, value: k }))}
                style={{ width: 120 }}
                size="small"
              />
            </Space>
            {(ticket.status === 'in_progress' || ticket.status === 'on_hold') && (
              <TextArea
                rows={2}
                value={resolution}
                onChange={e => setResolution(e.target.value)}
                placeholder="Resolución (requerida para resolver/cerrar)..."
                style={{ marginTop: 8 }}
              />
            )}
          </div>
        )}

        <SlaTimer ticket={ticket} />

        {execution && (
          <>
            <Divider>Flujo de Trabajo</Divider>
            <Tag color={execution.status === 'completed' ? 'green' : execution.status === 'cancelled' ? 'red' : 'blue'}>
              {execution.status === 'running' ? 'En ejecución' : execution.status === 'completed' ? 'Completado' : 'Cancelado'}
            </Tag>
            <Steps
              direction="vertical"
              size="small"
              style={{ marginTop: 12 }}
              current={-1}
              items={(execution.workflow?.nodes || [])
                .filter(n => n.data?.nodeType !== 'start')
                .map(node => {
                  const ticketNode = (execution.tickets || []).find(t => t.source_node_id === node.id);
                  const isEnd = node.data?.nodeType === 'end';
                  const isCondition = node.data?.nodeType === 'condition';
                  const isNotification = node.data?.nodeType === 'notification';
                  return {
                    title: (
                      <Space>
                        {NODE_ICONS[node.data?.nodeType]}
                        <span>{NODE_LABELS[node.data?.nodeType] || node.data?.label || node.data?.nodeType}</span>
                      </Space>
                    ),
                    status: isEnd ? 'finish' : ticketNode
                      ? (['resolved', 'closed'].includes(ticketNode.status) ? 'finish' : 'process')
                      : (isCondition || isNotification ? 'finish' : 'wait'),
                    description: ticketNode ? (
                      <Link to={`/tickets/${ticketNode.id}`} style={{ fontSize: 12 }}>
                        {ticketNode.code || `#${ticketNode.id}`} - {TICKET_STATUS[ticketNode.status] || ticketNode.status}
                      </Link>
                    ) : isEnd ? (
                      <span style={{ fontSize: 12, color: '#999' }}>Flujo finalizado</span>
                    ) : isNotification ? (
                      <span style={{ fontSize: 12, color: '#999' }}>Notificación enviada</span>
                    ) : undefined,
                  };
                })}
            />
          </>
        )}

        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="Solicitante">{ticket.requester?.full_name}</Descriptions.Item>
          <Descriptions.Item label="Email">{ticket.requester?.email}</Descriptions.Item>
          <Descriptions.Item label="Servicio">{ticket.service?.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Prioridad">{ticket.priority?.toUpperCase()}</Descriptions.Item>
          <Descriptions.Item label="Grupo asignado">{ticket.assignedGroup?.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Usuario asignado">{ticket.assignedUser?.full_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Creado">{formatDate(ticket.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="Actualizado">{formatDate(ticket.updatedAt)}</Descriptions.Item>
          <Descriptions.Item label="Primera Respuesta">{ticket.first_response_at ? formatDate(ticket.first_response_at) : '-'}</Descriptions.Item>
          <Descriptions.Item label="Resolución">{ticket.resolved_at ? formatDate(ticket.resolved_at) : '-'}</Descriptions.Item>
          <Descriptions.Item label="Resolución (detalle)" span={2}>{ticket.resolution || '-'}</Descriptions.Item>
        </Descriptions>

        {ticket.description && (
          <>
            <Divider>Descripción</Divider>
            <Typography.Paragraph>{ticket.description}</Typography.Paragraph>
          </>
        )}

        {Object.keys(ticket.form_data || {}).length > 0 && (
          <>
            <Divider>Datos del Formulario</Divider>
            {Object.entries(ticket.form_data).map(([k, v]) => (
              <div key={k}><strong>{k}:</strong> {typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>
            ))}
          </>
        )}

        <Divider>Adjuntos</Divider>
        {ticket.attachments?.length > 0 ? (
          <List
            dataSource={ticket.attachments}
            renderItem={att => (
              <List.Item>
                <a href={`/uploads/${att.filename}`} target="_blank" rel="noopener noreferrer">
                  <LinkOutlined /> {att.original_name}
                </a>
                <span style={{ color: '#999', marginLeft: 8 }}>
                  {att.user?.full_name} - {formatDate(att.createdAt)}
                </span>
              </List.Item>
            )}
          />
        ) : (
          <Typography.Paragraph type="secondary">Sin adjuntos</Typography.Paragraph>
        )}

        {(canManage || ticket.requester_id === user?.id) && (
          <div style={{ marginBottom: 16 }}>
            <input type="file" id="file-upload" style={{ display: 'none' }} onChange={handleAttach} />
            <Button icon={<UploadOutlined />} onClick={() => document.getElementById('file-upload').click()}>
              Subir Archivo
            </Button>
          </div>
        )}

        <Divider>Comentarios</Divider>

        <List
          dataSource={ticket.comments || []}
          renderItem={c => (
            <List.Item>
              <div style={{ width: '100%' }}>
                <Space>
                  <strong>{c.user?.full_name}</strong>
                  {c.is_internal && <Tag color="orange">Interno</Tag>}
                  <span style={{ color: '#999', fontSize: 12 }}>{formatDate(c.createdAt)}</span>
                </Space>
                <div style={{ marginTop: 4 }}>{c.content}</div>
              </div>
            </List.Item>
          )}
        />

        <Divider />
        <Form.Item style={{ margin: 0 }}>
          <TextArea
            rows={3}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Agregar un comentario..."
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleAddComment}
            loading={commenting}
            style={{ marginTop: 8 }}
          >
            Comentar
          </Button>
        </Form.Item>
      </Card>
    </div>
  );
}
