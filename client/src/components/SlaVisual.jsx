import { Progress, Tag, Typography, Tooltip } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

const NODE_COLORS = {
  incident: '#ff4d4f',
  work_order: '#722ed1',
  change_request: '#faad14',
  problem: '#fa541c',
};

const NODE_LABELS = {
  incident: 'Incidente',
  work_order: 'Orden Trabajo',
  change_request: 'Solicitud Cambio',
  problem: 'Problema',
};

function formatTime(minutes) {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function SlaVisual({ breakdown = [], totalMinutes = 0 }) {
  if (!breakdown.length) return null;

  const maxMinutes = Math.max(...breakdown.map(b => b.resolutionMinutes), 1);

  return (
    <div style={{ background: '#fafafa', borderRadius: 8, padding: 16, border: '1px solid #e8e8e8' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <ClockCircleOutlined style={{ fontSize: 24, color: '#1677ff' }} />
        <div>
          <Typography.Text strong style={{ fontSize: 16, display: 'block' }}>SLA Total Estimado</Typography.Text>
          <Typography.Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1677ff' }}>
            {formatTime(totalMinutes)}
          </Typography.Text>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: 12 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
          Desglose por nodo:
        </Typography.Text>
        {breakdown.map(item => {
          const color = NODE_COLORS[item.nodeType] || '#1677ff';
          const pct = Math.round((item.resolutionMinutes / maxMinutes) * 100);
          return (
            <div key={item.nodeId} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Tag color={color} style={{ margin: 0 }}>{NODE_LABELS[item.nodeType] || item.nodeType}</Tag>
                <Typography.Text style={{ fontSize: 13, fontWeight: 500 }}>{item.slaName}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>
                  {formatTime(item.resolutionMinutes)}
                </Typography.Text>
              </div>
              {item.nodeLabel !== item.nodeType && (
                <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                  {item.nodeLabel}
                </Typography.Text>
              )}
              <Tooltip title={`Prioridad: ${item.priority}`}>
                <Progress
                  percent={pct}
                  showInfo={false}
                  size="small"
                  strokeColor={color}
                  trailColor="#f0f0f0"
                />
              </Tooltip>
            </div>
          );
        })}
      </div>
    </div>
  );
}
