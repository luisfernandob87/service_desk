import { Progress, Tooltip, Tag } from 'antd';
import { formatDate, timeRemaining, slaProgress } from '../utils/formatDate';

export default function SlaTimer({ ticket }) {
  const deadline = ticket.sla_resolution_deadline;
  if (!deadline) return null;

  const sla = slaProgress(ticket.createdAt, deadline);
  const remaining = timeRemaining(deadline);
  let status = 'active';
  let color = '#52c41a';

  if (ticket.status === 'on_hold') {
    status = 'normal';
    color = '#999';
  } else if (remaining?.expired || sla >= 100) {
    status = 'exception';
    color = '#ff4d4f';
  } else if (sla >= 75) {
    color = '#faad14';
  } else if (sla >= 50) {
    color = '#1890ff';
  }

  const responseRemaining = timeRemaining(ticket.sla_response_deadline);
  const responseOverdue = responseRemaining?.expired;

  return (
    <div style={{ marginBottom: 16 }}>
      {ticket.sla_breached && <Tag color="red" style={{ marginBottom: 8 }}>SLA Incumplido</Tag>}
      {ticket.status === 'on_hold' && <Tag color="orange" style={{ marginBottom: 8 }}>SLA Pausado</Tag>}
      <Tooltip title={
        <>
          <div>Resolución: {formatDate(deadline)}</div>
          <div>Respuesta: {formatDate(ticket.sla_response_deadline)}</div>
          {!!ticket.sla_paused_minutes && <div>Tiempo pausado: {Math.round(ticket.sla_paused_minutes)} min</div>}
        </>
      }>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>SLA Resolución:</span>
          <Progress
            percent={Math.min(100, sla)}
            status={status}
            strokeColor={color}
            size="small"
            style={{ flex: 1, marginBottom: 0 }}
            format={() => ticket.status === 'on_hold'
              ? 'Pausado'
              : remaining?.expired
                ? 'Vencido'
                : `${remaining?.hours || 0}h ${remaining?.minutes || 0}m`
            }
          />
        </div>
        {responseOverdue && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 12, color: '#ff4d4f', whiteSpace: 'nowrap' }}>SLA Respuesta: Vencido</span>
          </div>
        )}
      </Tooltip>
    </div>
  );
}
