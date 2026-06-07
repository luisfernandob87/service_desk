import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Table, Tag, Typography, Button, Card, Space, Tooltip } from 'antd';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { TICKET_STATUS } from '../../utils/constants';
import { formatDateShort } from '../../utils/formatDate';

const statusColors = {
  running: 'blue', completed: 'green', cancelled: 'red',
};

export default function MyRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/workflow-executions');
        setExecutions(res.data);
      } catch { /* ignore */ }
      finally { setLoading(false) }
    })();
  }, [user]);

  const columns = [
    {
      title: 'Petición', dataIndex: 'request_number', key: 'request_number',
      render: (v, r) => <Link to={`/admin/peticiones/${r.id}`}>#{v || r.id}</Link>,
    },
    { title: 'Servicio', key: 'service', render: (_, r) => r.service?.name || '-' },
    {
      title: 'Estado', dataIndex: 'status', key: 'status',
      render: v => (
        <Tag color={statusColors[v]}>
          {v === 'running' ? 'En ejecución' : v === 'completed' ? 'Completado' : 'Cancelado'}
        </Tag>
      ),
    },
    {
      title: 'Casos', key: 'tickets',
      render: (_, r) => (
        <Space size={4}>
          {(r.tickets || []).map(t => (
            <Tooltip key={t.id} title={`${t.title} - ${t.status}`}>
              <Tag color={t.status === 'resolved' || t.status === 'closed' ? 'green' : 'blue'}>
                {t.code || `#${t.id}`}
              </Tag>
            </Tooltip>
          ))}
        </Space>
      ),
    },
    {
      title: 'Creado', key: 'createdAt',
      render: (_, r) => formatDateShort(r.createdAt),
    },
    {
      title: 'Acción', key: 'action',
      render: (_, r) => {
        const firstTicket = r.tickets?.[0];
        if (firstTicket) {
          return <Button type="link" onClick={() => navigate(`/tickets/${firstTicket.id}`)}>Ver</Button>;
        }
        return <Button type="link" onClick={() => navigate(`/admin/peticiones/${r.id}`)}>Ver</Button>;
      },
    },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <Typography.Title level={4}>Mis Solicitudes</Typography.Title>
      <Card>
        <Table dataSource={executions} columns={columns} rowKey="id" loading={loading}
          pagination={{ pageSize: 20 }} size="small" />
      </Card>
    </div>
  );
}
