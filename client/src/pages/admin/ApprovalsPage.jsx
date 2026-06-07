import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Tag, Select, Spin, Button, Typography, Space, Badge } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/formatDate';
import { TICKET_TYPES } from '../../utils/constants';

const statusColors = { pending: 'gold', approved: 'green', rejected: 'red', cancelled: 'default' };

export default function ApprovalsPage() {
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
      const res = await api.get('/approvals', { params });
      setData(res.data);
    } catch { /* */ }
    finally { setLoading(false) }
  };

  useEffect(() => { load() }, [statusFilter]);

  const columns = [
    {
      title: 'Código', dataIndex: 'code', key: 'code',
      render: (v, r) => (
        <Space>
          {r.status === 'pending' && <Badge status="processing" color="gold" />}
          <a onClick={() => navigate(`/admin/aprobaciones/${r.id}`)}>{r.code || `#${r.id}`}</a>
        </Space>
      ),
    },
    { title: 'Etapa', dataIndex: 'stage', key: 'stage' },
    {
      title: 'Petición', key: 'request',
      render: (_, r) => r.execution?.request_number
        ? <a onClick={() => navigate(`/admin/peticiones/${r.execution.id}`)}>#{r.execution.request_number}</a>
        : '-',
    },
    {
      title: 'Estado', dataIndex: 'status', key: 'status',
      render: (v) => <Tag color={statusColors[v]}>{v === 'pending' ? 'Pendiente' : v === 'approved' ? 'Aprobado' : v === 'rejected' ? 'Rechazado' : 'Cancelado'}</Tag>,
    },
    { title: 'Solicitado A', key: 'approver', render: (_, r) => r.approver?.full_name || r.assignedGroup?.name || '-' },
    { title: 'Respondió', key: 'responder', render: (_, r) => r.responder?.full_name || '-' },
    {
      title: 'Creado', key: 'created', render: (_, r) => formatDate(r.createdAt),
    },
    {
      title: '',
      key: 'action',
      render: (_, r) => <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/admin/aprobaciones/${r.id}`)} />,
    },
  ];

  return (
    <Card title="Aprobaciones" extra={
      <Select
        allowClear placeholder="Filtrar estado" style={{ width: 150 }}
        value={statusFilter || undefined}
        onChange={v => setStatusFilter(v || '')}
        options={[
          { label: 'Pendiente', value: 'pending' },
          { label: 'Aprobado', value: 'approved' },
          { label: 'Rechazado', value: 'rejected' },
          { label: 'Cancelado', value: 'cancelled' },
        ]}
      />
    }>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div> : (
        <Table dataSource={data} columns={columns} rowKey="id" pagination={false} scroll={{ x: 800 }} size="small" />
      )}
    </Card>
  );
}
