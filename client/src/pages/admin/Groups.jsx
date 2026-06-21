import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import api from '../../api/client';

export default function Groups() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [filterActive, setFilterActive] = useState(true);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [groupsRes, orgsRes] = await Promise.all([
        api.get('/support-groups'),
        api.get('/organizations'),
      ]);
      setData(groupsRes.data);
      setOrgs(orgsRes.data);
    } catch { message.error('Error al cargar') }
    finally { setLoading(false) }
  };

  useEffect(() => { loadData() }, []);

  const handleSave = async (values) => {
    try {
      if (editing) {
        await api.put(`/support-groups/${editing.id}`, values);
        message.success('Grupo actualizado');
      } else {
        await api.post('/support-groups', values);
        message.success('Grupo creado');
      }
      setModalOpen(false);
      form.resetFields();
      setEditing(null);
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleToggleActive = async (record) => {
    try {
      await api.put(`/support-groups/${record.id}`, { is_active: !record.is_active });
      message.success(record.is_active ? 'Grupo deshabilitado' : 'Grupo habilitado');
      loadData();
    } catch { message.error('Error al cambiar estado') }
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      organization_ids: record.organizations?.map(o => o.id) || [],
    });
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const filteredData = data.filter(u => filterActive === null || u.is_active === filterActive);

  const columns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Descripción', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'Miembros', key: 'members',
      render: (_, r) => r.members?.length || 0,
    },
    {
      title: 'Activo', dataIndex: 'is_active', key: 'is_active',
      render: (v) => v ? <Tag color="green">Sí</Tag> : <Tag color="red">No</Tag>,
    },
    {
      title: 'Acciones', key: 'actions',
      render: (_, r) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
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
      <Typography.Title level={4}>Grupos de Soporte</Typography.Title>
      <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ marginBottom: 16 }}>
        Nuevo Grupo
      </Button>
      <Space style={{ marginBottom: 16 }}>
        <Select value={filterActive} onChange={setFilterActive} style={{ width: 140 }}
          options={[
            { label: 'Activos', value: true },
            { label: 'Inactivos', value: false },
          ]} />
      </Space>
      <Table dataSource={filteredData} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editing ? 'Editar Grupo' : 'Nuevo Grupo'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="organization_ids" label="Organizaciones" rules={[{ required: true, message: 'Selecciona al menos una' }]}>
            <Select mode="multiple" options={orgs.map(o => ({ label: o.name, value: o.id }))} />
          </Form.Item>
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Descripción">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
