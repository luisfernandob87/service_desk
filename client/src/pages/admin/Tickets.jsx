import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Button, Select, Space, Typography, Card } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import api from '../../api/client';
import { TICKET_TYPES, TICKET_STATUS } from '../../utils/constants';
import { formatDateShort } from '../../utils/formatDate';

const statusColors = { new: 'blue', in_progress: 'orange', on_hold: 'gold', resolved: 'green', closed: 'default', cancelled: 'red', reopened: 'purple' };
const typeColors = { incident: 'red', work_order: 'purple', change_request: 'gold', problem: 'volcano' };

export default function AdminTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const res = await api.get('/tickets', { params });
      setTickets(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false) }
  };

  useEffect(() => { loadTickets() }, [statusFilter, typeFilter]);

  const columns = [
    { title: '#', dataIndex: 'id', key: 'id', width: 60, render: v => `#${v}` },
    { title: 'Título', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: 'Tipo', dataIndex: 'type', key: 'type',
      render: v => <Tag color={typeColors[v]}>{TICKET_TYPES[v]}</Tag>,
    },
    {
      title: 'Estado', dataIndex: 'status', key: 'status',
      render: v => <Tag color={statusColors[v]}>{TICKET_STATUS[v]}</Tag>,
    },
    {
      title: 'Prioridad', dataIndex: 'priority', key: 'priority',
      render: v => {
        const colors = { low: 'default', medium: 'blue', high: 'orange', critical: 'red' };
        return <Tag color={colors[v]}>{v?.toUpperCase()}</Tag>;
      },
    },
    { title: 'Solicitante', key: 'requester', render: (_, r) => r.requester?.full_name || '-' },
    { title: 'Asignado', key: 'assigned', render: (_, r) => r.assignedUser?.full_name || r.assignedGroup?.name || '-' },
    {
      title: 'Creado', dataIndex: 'createdAt', key: 'createdAt',
      render: v => formatDateShort(v),
    },
    {
      title: 'Acción', key: 'action',
      render: (_, r) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/tickets/${r.id}`)}>
          Ver
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>Tickets</Typography.Title>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Select
            placeholder="Filtrar por estado"
            value={statusFilter || undefined}
            onChange={v => setStatusFilter(v || '')}
            allowClear
            style={{ width: 160 }}
            options={Object.entries(TICKET_STATUS).map(([k, v]) => ({ label: v, value: k }))}
          />
          <Select
            placeholder="Filtrar por tipo"
            value={typeFilter || undefined}
            onChange={v => setTypeFilter(v || '')}
            allowClear
            style={{ width: 180 }}
            options={Object.entries(TICKET_TYPES).map(([k, v]) => ({ label: v, value: k }))}
          />
        </Space>
      </Card>

      <Table dataSource={tickets} columns={columns} rowKey="id" loading={loading}
        pagination={{ pageSize: 20 }} size="small" />
    </div>
  );
}
