import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Typography, Tag, Descriptions, Button, Spin, Space, Divider, Steps, Modal, Input, message, List } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, BugOutlined, ToolOutlined, SwapOutlined, ExclamationCircleOutlined, BellOutlined, BranchesOutlined, StopOutlined } from '@ant-design/icons';
import api from '../../api/client';
import { TICKET_TYPES, TICKET_STATUS } from '../../utils/constants';
import { getOrderedNodes, getStepStatus } from '../../utils/workflowHelpers';
import { formatDate } from '../../utils/formatDate';

const NODE_ICONS = {
  start: <CheckCircleOutlined />, incident: <BugOutlined style={{ color: '#ff4d4f' }} />,
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

export default function ApprovalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [approval, setApproval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/approvals/${id}`);
      setApproval(res.data);
    } catch (e) {
      message.error('Error al cargar aprobación');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await api.put(`/approvals/${id}/resolve`, { status: 'approved' });
      message.success('Aprobación concedida');
      load();
    } catch (e) {
      message.error(e.response?.data?.error || 'Error al aprobar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      message.error('Debes indicar una razón de rechazo');
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/approvals/${id}/resolve`, { status: 'rejected', rejection_reason: rejectionReason.trim() });
      message.success('Aprobación rechazada');
      setRejectModal(false);
      setRejectionReason('');
      load();
    } catch (e) {
      message.error(e.response?.data?.error || 'Error al rechazar');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!approval) return null;

  const exec = approval.execution;
  const ticket = approval.ticket;
  const isPending = approval.status === 'pending';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/aprobaciones')} style={{ marginBottom: 16 }}>Volver</Button>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>{approval.code || `Aprobación #${approval.id}`}</Typography.Title>
          <Tag color={approval.status === 'approved' ? 'green' : approval.status === 'rejected' ? 'red' : 'gold'}>
            {approval.status === 'pending' ? 'Pendiente' : approval.status === 'approved' ? 'Aprobado' : 'Rechazado'}
          </Tag>
          <Tag>{approval.stage}</Tag>
        </Space>

        {exec && (
          <>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="Petición">
                <Link to={`/admin/peticiones/${exec.id}`}>#{exec.request_number || exec.id}</Link>
              </Descriptions.Item>
              <Descriptions.Item label="Solicitante">{exec.requester?.full_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Servicio">{exec.service?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Estado petición">
                <Tag color={exec.status === 'completed' ? 'green' : exec.status === 'closed' ? 'default' : exec.status === 'cancelled' ? 'red' : exec.status === 'on_hold' ? 'gold' : 'blue'}>
                  {exec.status === 'active' ? 'Activo' : exec.status === 'on_hold' ? 'En Espera' : exec.status === 'completed' ? 'Completado' : exec.status === 'closed' ? 'Cerrado' : 'Cancelado'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider>Flujo de Trabajo</Divider>
            <Steps
              direction="vertical" size="small" current={-1}
              items={(() => {
                const orderedNodes = getOrderedNodes(exec.workflow?.nodes || [], exec.workflow?.edges || []);
                return orderedNodes.filter(n => n.data?.nodeType !== 'start').map(node => {
                  const status = getStepStatus(node, exec, orderedNodes);
                  const ticketNode = (exec.tickets || []).find(t => t.source_node_id === node.id);
                  const approvalNode = (exec.approvals || []).find(a => a.source_node_id === node.id);
                  const isEnd = node.data?.nodeType === 'end';
                  const isCondition = node.data?.nodeType === 'condition';
                  const isNotification = node.data?.nodeType === 'notification';
                  const isThisNode = node.id === approval.source_node_id || node.data?.label === approval.stage;
                  const isApprovalType = node.data?.nodeType === 'approval';
                  const isWaiting = status === 'wait';
                  return {
                    title: (
                      <Space>
                        {NODE_ICONS[node.data?.nodeType]}
                        <span style={{ fontWeight: isThisNode ? 600 : 400, color: isWaiting ? '#bbb' : undefined }}>
                          {NODE_LABELS[node.data?.nodeType] || node.data?.label || node.data?.nodeType}
                        </span>
                        {isThisNode && <Tag color="blue">Actual</Tag>}
                      </Space>
                    ),
                    status,
                    description: isApprovalType && approvalNode ? (
                      <div style={{ fontSize: 12 }}>
                        <div>{approvalNode.code || `APR-${approvalNode.id}`} - {approvalNode.stage}
                          <Tag style={{ marginLeft: 8 }} color={approvalNode.status === 'approved' ? 'green' : approvalNode.status === 'rejected' ? 'red' : 'gold'}>
                            {approvalNode.status === 'pending' ? 'Pendiente' : approvalNode.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                          </Tag>
                        </div>
                        {ticketNode && (
                          <Link to={`/tickets/${ticketNode.id}`}>
                            Ticket: {ticketNode.code || `#${ticketNode.id}`} - {ticketNode.title}
                          </Link>
                        )}
                      </div>
                    ) : ticketNode ? (
                      <Link to={`/tickets/${ticketNode.id}`} style={{ fontSize: 12 }}>
                        {ticketNode.code || `#${ticketNode.id}`} - {ticketNode.title} ({TICKET_STATUS[ticketNode.status] || ticketNode.status})
                        {ticketNode.resolution && <div style={{ color: '#666' }}>Resolución: {ticketNode.resolution}</div>}
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
                    ) : isWaiting ? <span style={{ fontSize: 12, color: '#bbb' }}>Pendiente por ejecutar</span> : undefined,
                  };
                });
              })()}
            />

            <Divider>Datos del Ticket</Divider>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Título">{ticket?.title || '-'}</Descriptions.Item>
              <Descriptions.Item label="Descripción">{ticket?.description || '-'}</Descriptions.Item>
              <Descriptions.Item label="Tipo">{ticket ? TICKET_TYPES[ticket.type] : '-'}</Descriptions.Item>
              <Descriptions.Item label="Estado">{ticket ? TICKET_STATUS[ticket.status] : '-'}</Descriptions.Item>
              <Descriptions.Item label="Resolución">{ticket?.resolution || '-'}</Descriptions.Item>
            </Descriptions>

            {ticket?.form_data && Object.keys(ticket.form_data).length > 0 && (
              <>
                <Divider>Datos del Formulario</Divider>
                {Object.entries(ticket.form_data).map(([k, v]) => (
                  <div key={k}><strong>{k}:</strong> {typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>
                ))}
              </>
            )}

            {exec.context?.form_data && Object.keys(exec.context.form_data).length > 0 && (
              <>
                <Divider>Datos Acumulados del Flujo</Divider>
                {Object.entries(exec.context.form_data).filter(([k]) => !ticket?.form_data?.[k]).map(([k, v]) => (
                  <div key={k}><strong>{k}:</strong> {typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>
                ))}
              </>
            )}
          </>
        )}

        {!isPending && approval.responder && (
          <Descriptions column={2} size="small" bordered style={{ marginTop: 16 }}>
            <Descriptions.Item label="Respondió">
              {approval.responder.full_name}
            </Descriptions.Item>
            <Descriptions.Item label="Fecha">
              {approval.resolved_at ? formatDate(approval.resolved_at) : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}

        {isPending && (
          <>
            <Divider>Acción</Divider>
            <Space style={{ justifyContent: 'center', width: '100%' }}>
              <Button type="primary" icon={<CheckCircleOutlined />} size="large" loading={submitting} onClick={handleApprove}>
                Aprobar
              </Button>
              <Button danger icon={<CloseCircleOutlined />} size="large" onClick={() => setRejectModal(true)}>
                Rechazar
              </Button>
            </Space>
          </>
        )}

        {approval.rejection_reason && (
          <>
            <Divider>Razón de Rechazo</Divider>
            <Card size="small" style={{ background: '#fff2f0', borderColor: '#ffccc7' }}>
              <Typography.Text>{approval.rejection_reason}</Typography.Text>
            </Card>
          </>
        )}
      </Card>

      <Modal
        title="Razón de Rechazo"
        open={rejectModal}
        onOk={handleReject}
        onCancel={() => { setRejectModal(false); setRejectionReason(''); }}
        confirmLoading={submitting}
        okText="Rechazar"
        okButtonProps={{ danger: true, disabled: !rejectionReason.trim() }}
      >
        <Input.TextArea
          rows={4}
          value={rejectionReason}
          onChange={e => setRejectionReason(e.target.value)}
          placeholder="Indica la razón del rechazo (obligatorio)..."
        />
      </Modal>
    </div>
  );
}
