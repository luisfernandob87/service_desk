import { useState, useEffect } from 'react';
import { Table, Button, Space, message, Tag, Typography, Input, Select } from 'antd';
import { PlusOutlined, EditOutlined, CloseOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { ROLES, ROLE_LABELS } from '../../utils/constants';

export default function Users() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterRole, setFilterRole] = useState('end_user');
  const [filterActive, setFilterActive] = useState(true);
  const [searchText, setSearchText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setData(res.data);
    } catch { message.error('Error al cargar') }
    finally { setLoading(false) }
  };

  useEffect(() => { loadData() }, []);

  const handleToggleActive = async (record) => {
    try {
      await api.put(`/users/${record.id}`, { is_active: !record.is_active });
      message.success(record.is_active ? 'Usuario deshabilitado' : 'Usuario habilitado');
      loadData();
    } catch { message.error('Error al cambiar estado') }
  };

  const filteredData = data.filter(u => {
    if (filterRole && u.role !== filterRole) return false;
    if (filterActive !== null && u.is_active !== filterActive) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      if (!u.full_name?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const roleColors = { admin: 'red', manager: 'blue', resolver: 'green', end_user: 'default' };

  const columns = [
    { title: 'Nombre', dataIndex: 'full_name', key: 'full_name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Rol', dataIndex: 'role', key: 'role',
      render: (v) => <Tag color={roleColors[v]}>{ROLE_LABELS[v]}</Tag>,
    },
    {
      title: 'Organización', key: 'organization',
      render: (_, r) => r.organization?.name,
    },
    {
      title: 'Unidad de Negocio', key: 'businessUnit',
      render: (_, r) => r.businessUnit?.name,
    },
    {
      title: 'Departamento', key: 'department',
      render: (_, r) => r.department?.name,
    },
    {
      title: 'Puesto', key: 'position',
      render: (_, r) => r.position?.name,
    },
    {
      title: 'Activo', dataIndex: 'is_active', key: 'is_active',
      render: (v) => v ? <Tag color="green">Sí</Tag> : <Tag color="red">No</Tag>,
    },
    {
      title: 'Acciones', key: 'actions',
      render: (_, r) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => navigate(`/admin/users/${r.id}/edit`)} />
          <Button
            icon={r.is_active ? <CloseOutlined /> : <CheckOutlined />}
            size="small"
            danger={r.is_active}
            onClick={() => handleToggleActive(r)}
          >
            {r.is_active ? 'Deshabilitar' : 'Habilitar'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>Usuarios</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/users/new')}>
          Nuevo Usuario
        </Button>
      </div>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search allowClear placeholder="Buscar nombre o email..." onSearch={setSearchText} onChange={e => setSearchText(e.target.value)} style={{ width: 240 }} />
        <Select
          value={filterRole}
          onChange={setFilterRole}
          style={{ width: 180 }}
          options={[{ label: 'Todos los roles', value: '' }, ...Object.entries(ROLE_LABELS).map(([k, v]) => ({ label: v, value: k }))]}
        />
        <Select
          value={filterActive}
          onChange={setFilterActive}
          style={{ width: 140 }}
          options={[
            { label: 'Activos', value: true },
            { label: 'Inactivos', value: false },
          ]}
        />
      </Space>
      <Table dataSource={filteredData} columns={columns} rowKey="id" loading={loading} />
    </div>
  );
}
