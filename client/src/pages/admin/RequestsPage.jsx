import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Tag, Typography, Spin, Select, Space } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/formatDate';
import { TICKET_STATUS } from '../../utils/constants';

const statusColors = { active: 'blue', on_hold: 'gold', completed: 'green', closed: 'default', cancelled: 'red' };

export default function RequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = { my_cases: 'true' };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/workflow-executions', { params });
      setData(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false) }
  };

  useEffect(() => { load() }, [statusFilter]);

  const columns = [
    {
      title: 'Petición',
      dataIndex: 'request_number',
      key: 'request_number',
      render: (v, r) => <a onClick={() => navigate(`/support/peticiones/${r.id}`)}>#{v || r.id}</a>,
    },
    { title: 'Servicio', key: 'service', render: (_, r) => r.service?.name || '-' },
    { title: 'Solicitante', key: 'requester', render: (_, r) => r.requester?.full_name || '-' },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (v) => (
        <Tag color={statusColors[v]}>
          {v === 'active' ? 'Activo' : v === 'on_hold' ? 'En Espera' : v === 'completed' ? 'Completado' : v === 'closed' ? 'Cerrado' : 'Cancelado'}
        </Tag>
      ),
    },
    {
      title: 'Grupo asignado',
      key: 'group',
      render: (_, r) => r.assignedGroup?.name || '-',
    },
    {
      title: 'Tickets',
      key: 'tickets',
      render: (_, r) => (
        <Space size={4}>
          {(r.tickets || []).map(t => (
            <Tag key={t.id} color={t.status === 'resolved' || t.status === 'closed' ? 'green' : 'blue'}>
              {t.code || `#${t.id}`} {TICKET_STATUS[t.status] || t.status}
            </Tag>
          ))}
        </Space>
      ),
    },
    { title: 'Creado', key: 'created', render: (_, r) => formatDate(r.createdAt) },
    {
      title: '',
      key: 'action',
      render: (_, r) => <ArrowRightOutlined onClick={() => navigate(`/support/peticiones/${r.id}`)} />,
    },
  ];

  return (
    <Card title="Peticiones" extra={
      <Select
        allowClear
        placeholder="Filtrar estado"
        style={{ width: 150 }}
        value={statusFilter || undefined}
        onChange={v => setStatusFilter(v || '')}
        options={[
          { label: 'Activo', value: 'active' },
          { label: 'En Espera', value: 'on_hold' },
          { label: 'Completado', value: 'completed' },
          { label: 'Cerrado', value: 'closed' },
          { label: 'Cancelado', value: 'cancelled' },
        ]}
      />
    }>
      {loading ? <Spin /> : (
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 900 }}
          size="small"
        />
      )}
    </Card>
  );
}
