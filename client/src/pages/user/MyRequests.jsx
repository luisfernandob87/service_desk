import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Table, Tag, Typography, Button, Card, Space, Tooltip } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { TICKET_STATUS } from '../../utils/constants';
import { formatDateShort } from '../../utils/formatDate';

const statusColors = {
  active: 'blue', on_hold: 'gold', completed: 'green', closed: 'default', cancelled: 'red',
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
      render: (v, r) => <Link to={`/my-requests/${r.id}`}>#{v || r.id}</Link>,
    },
    { title: 'Servicio', key: 'service', render: (_, r) => (
      <Space>
        {r.service?.name || '-'}
        {r.parentExecution && (
          <Tooltip title={`Reapertura de petición #${r.parentExecution.request_number || r.parentExecution.id}`}>
            <Link to={`/my-requests/${r.parentExecution.id}`}><LinkOutlined /></Link>
          </Tooltip>
        )}
      </Space>
    )},
    {
      title: 'Estado', dataIndex: 'status', key: 'status',
      render: v => (
        <Tag color={statusColors[v]}>
          {v === 'active' ? 'Activo' : v === 'on_hold' ? 'En Espera' : v === 'completed' ? 'Completado' : v === 'closed' ? 'Cerrado' : 'Cancelado'}
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
      render: (_, r) => <Button type="link" onClick={() => navigate(`/my-requests/${r.id}`)}>Ver</Button>,
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
