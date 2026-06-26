import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Select, Input, Space, message, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../../api/client';

export default function AdminServices() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterPublished, setFilterPublished] = useState(true);
  const [searchText, setSearchText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/services');
      setData(res.data);
    } catch { message.error('Error al cargar') }
    finally { setLoading(false) }
  };

  useEffect(() => { loadData() }, []);

  const filteredData = data.filter(s =>
    (!filterPublished || s.is_published) &&
    (!searchText || s.name.toLowerCase().includes(searchText.toLowerCase()))
  );

  const columns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Descripción Corta', dataIndex: 'short_description', key: 'short_description', ellipsis: true },
    {
      title: 'Categoría', key: 'category', render: (_, r) => r.category?.name || '-',
    },
    {
      title: 'Grupo Owner', key: 'defaultGroup',
      render: (_, r) => r.defaultAssignedGroup?.name || '-',
    },
    {
      title: 'Organizaciones', key: 'orgs',
      render: (_, r) => (r.organizations || []).map(o => <Tag key={o.id}>{o.name}</Tag>),
    },
    {
      title: 'Publicado', dataIndex: 'is_published', key: 'is_published',
      render: (v) => v ? <Tag color="green">Sí</Tag> : <Tag color="default">No</Tag>,
    },
    {
      title: 'Acciones', key: 'actions',
      render: (_, r) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small"
            href={`/org/${r.organizations?.[0]?.slug || 'principal'}/services/${r.id}`} target="_blank" />
          <Button icon={<EditOutlined />} size="small" onClick={() => navigate(`/admin/services/${r.id}/edit`)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>Servicios</Typography.Title>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/services/new')} style={{ marginBottom: 16 }}>
        Nuevo Servicio
      </Button>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search allowClear placeholder="Buscar por nombre..." onSearch={setSearchText} onChange={e => setSearchText(e.target.value)} style={{ width: 220 }} />
        <Select value={filterPublished} onChange={setFilterPublished} style={{ width: 160 }}
          options={[
            { label: 'Publicados', value: true },
            { label: 'Todos', value: false },
          ]} />
      </Space>
      <Table dataSource={filteredData} columns={columns} rowKey="id" loading={loading} />
    </div>
  );
}
