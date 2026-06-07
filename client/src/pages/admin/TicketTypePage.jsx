import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Tag, Typography, Spin, Select, Space, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/formatDate';
import { TICKET_TYPES, TICKET_STATUS, PRIORITIES } from '../../utils/constants';

const statusColors = { new: 'blue', in_progress: 'orange', on_hold: 'gold', resolved: 'green', closed: 'default', cancelled: 'red' };
const priorityColors = { low: 'green', medium: 'gold', high: 'orange', critical: 'red' };

export default function TicketTypePage({ type, title, icon }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = { type, my_cases: 'true' };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/tickets', { params });
      setData(res.data);
    } catch { /* */ }
    finally { setLoading(false) }
  };

  useEffect(() => { load() }, [type, statusFilter]);

  const columns = [
    { title: 'Código', dataIndex: 'code', key: 'code', render: (v, r) => <a onClick={() => navigate(`/tickets/${r.id}`)}>{v || `#${r.id}`}</a> },
    { title: 'Título', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: 'Solicitante', key: 'requester', render: (_, r) => r.requester?.full_name || '-' },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (v) => <Tag color={statusColors[v]}>{TICKET_STATUS[v]}</Tag>,
    },
    {
      title: 'Prioridad',
      dataIndex: 'priority',
      key: 'priority',
      render: (v) => <Tag color={priorityColors[v]}>{PRIORITIES[v]}</Tag>,
    },
    { title: 'Grupo', key: 'group', render: (_, r) => r.assignedGroup?.name || '-' },
    { title: 'Asignado a', key: 'assigned', render: (_, r) => r.assignedUser?.full_name || '-' },
    {
      title: 'Creado',
      key: 'created',
      render: (_, r) => formatDate(r.createdAt),
    },
    {
      title: '',
      key: 'action',
      render: (_, r) => <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/tickets/${r.id}`)} />,
    },
  ];

  return (
    <Card title={
      <Space>{icon}<span>{title}</span></Space>
    } extra={
      <Select
        allowClear
        placeholder="Filtrar estado"
        style={{ width: 150 }}
        value={statusFilter || undefined}
        onChange={v => setStatusFilter(v || '')}
        options={Object.entries(TICKET_STATUS).map(([k, v]) => ({ label: v, value: k }))}
      />
    }>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div> : (
        <Table dataSource={data} columns={columns} rowKey="id" pagination={false} scroll={{ x: 900 }} size="small" />
      )}
    </Card>
  );
}
