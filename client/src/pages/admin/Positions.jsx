import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '../../api/client';

export default function Positions() {
  const [data, setData] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [posRes, orgsRes] = await Promise.all([
        api.get('/positions'),
        api.get('/organizations'),
      ]);
      setData(posRes.data);
      setOrgs(orgsRes.data);
    } catch { message.error('Error al cargar') }
    finally { setLoading(false) }
  };

  useEffect(() => { loadData() }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleSave = async (values) => {
    try {
      if (editing) {
        await api.put(`/positions/${editing.id}`, values);
        message.success('Puesto actualizado');
      } else {
        await api.post('/positions', values);
        message.success('Puesto creado');
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
      await api.put(`/positions/${record.id}`, { is_active: !record.is_active });
      message.success(record.is_active ? 'Puesto deshabilitado' : 'Puesto habilitado');
      loadData();
    } catch { message.error('Error al cambiar estado') }
  };

  const orgMap = {};
  orgs.forEach(o => { orgMap[o.id] = o.name });

  const columns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Descripción', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'Organización', key: 'organization',
      render: (_, r) => r.organization?.name || orgMap[r.organization_id],
    },
    {
      title: 'Activo', dataIndex: 'is_active', key: 'is_active',
      render: (v) => v ? <Tag color="green">Sí</Tag> : <Tag color="red">No</Tag>,
    },
    {
      title: 'Acciones', key: 'actions',
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => openEdit(r)}>Editar</Button>
          <Button size="small" danger={r.is_active} onClick={() => handleToggleActive(r)}>
            {r.is_active ? 'Deshabilitar' : 'Habilitar'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>Puestos</Typography.Title>
      <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ marginBottom: 16 }}>
        Nuevo Puesto
      </Button>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editing ? 'Editar Puesto' : 'Nuevo Puesto'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); }}
        onOk={() => form.submit()}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="organization_id" label="Organización" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label"
              options={orgs.filter(o => o.is_active !== false).map(o => ({ label: o.name, value: o.id }))} />
          </Form.Item>
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Descripción">
            <Input.TextArea rows={3} />
          </Form.Item>
          {editing && (
            <Form.Item name="is_active" label="Activo" valuePropName="checked">
              <Select options={[{ label: 'Activo', value: true }, { label: 'Inactivo', value: false }]} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
