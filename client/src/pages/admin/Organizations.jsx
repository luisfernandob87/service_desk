import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Select, Input, Space, message, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, CloseOutlined, CheckOutlined, SearchOutlined, ApartmentOutlined } from '@ant-design/icons';
import api from '../../api/client';

export default function Organizations() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterActive, setFilterActive] = useState(true);
  const [searchText, setSearchText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/organizations');
      setData(res.data);
    } catch { message.error('Error al cargar') }
    finally { setLoading(false) }
  };

  useEffect(() => { loadData() }, []);

  const handleToggleActive = async (record) => {
    try {
      await api.put(`/organizations/${record.id}`, { is_active: !record.is_active });
      message.success(record.is_active ? 'Organización deshabilitada' : 'Organización habilitada');
      loadData();
    } catch { message.error('Error al cambiar estado') }
  };

  const filteredData = data.filter(u =>
    (filterActive === null || u.is_active === filterActive) &&
    (!searchText || u.name.toLowerCase().includes(searchText.toLowerCase()))
  );

  const columns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Slug', dataIndex: 'slug', key: 'slug' },
    {
      title: 'Unidades', key: 'buCount', width: 80,
      render: () => <Tag icon={<ApartmentOutlined />} />,
    },
    {
      title: 'Activo', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: (v) => v ? <Tag color="green">Sí</Tag> : <Tag color="red">No</Tag>,
    },
    {
      title: 'Acciones', key: 'actions', width: 180,
      render: (_, r) => (
        <Space>
          <Button icon={<EditOutlined />} size="small"
            onClick={() => navigate(`/admin/organizations/${r.id}/edit`)} />
          <Button
            icon={r.is_active ? <CloseOutlined /> : <CheckOutlined />}
            size="small" danger={r.is_active}
            onClick={() => handleToggleActive(r)}>
            {r.is_active ? 'Deshabilitar' : 'Habilitar'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>Organizaciones</Typography.Title>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/organizations/new')} style={{ marginBottom: 16 }}>
        Nueva Organización
      </Button>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search allowClear placeholder="Buscar por nombre..." onSearch={setSearchText} onChange={e => setSearchText(e.target.value)} style={{ width: 220 }} />
        <Select value={filterActive} onChange={setFilterActive} style={{ width: 140 }}
          options={[
            { label: 'Activos', value: true },
            { label: 'Inactivos', value: false },
          ]} />
      </Space>
      <Table dataSource={filteredData} columns={columns} rowKey="id" loading={loading} />
    </div>
  );
}
