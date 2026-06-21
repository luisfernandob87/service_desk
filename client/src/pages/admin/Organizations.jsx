import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, CloseOutlined, CheckOutlined } from '@ant-design/icons';
import api from '../../api/client';

export default function Organizations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterActive, setFilterActive] = useState(true);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/organizations');
      setData(res.data);
    } catch { message.error('Error al cargar') }
    finally { setLoading(false) }
  };

  useEffect(() => { loadData() }, []);

  const handleSave = async (values) => {
    try {
      if (editing) {
        await api.put(`/organizations/${editing.id}`, values);
        message.success('Organización actualizada');
      } else {
        await api.post('/organizations', values);
        message.success('Organización creada');
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
      await api.put(`/organizations/${record.id}`, { is_active: !record.is_active });
      message.success(record.is_active ? 'Organización deshabilitada' : 'Organización habilitada');
      loadData();
    } catch { message.error('Error al cambiar estado') }
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue(record);
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
    { title: 'Slug', dataIndex: 'slug', key: 'slug' },
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
      <Typography.Title level={4}>Organizaciones</Typography.Title>
      <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ marginBottom: 16 }}>
        Nueva Organización
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
        title={editing ? 'Editar Organización' : 'Nueva Organización'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="logo_url" label="URL del Logo">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
