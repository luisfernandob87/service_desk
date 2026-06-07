import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../api/client';
import { ROLES, ROLE_LABELS } from '../../utils/constants';

export default function Users() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [groups, setGroups] = useState([]);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, orgsRes, groupsRes] = await Promise.all([
        api.get('/users'),
        api.get('/organizations'),
        api.get('/support-groups'),
      ]);
      setData(usersRes.data);
      setOrgs(orgsRes.data);
      setGroups(groupsRes.data);
    } catch { message.error('Error al cargar') }
    finally { setLoading(false) }
  };

  useEffect(() => { loadData() }, []);

  const handleSave = async (values) => {
    try {
      if (editing) {
        if (!values.password) delete values.password;
        await api.put(`/users/${editing.id}`, values);
        message.success('Usuario actualizado');
      } else {
        await api.post('/users', values);
        message.success('Usuario creado');
      }
      setModalOpen(false);
      form.resetFields();
      setEditing(null);
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      message.success('Usuario eliminado');
      loadData();
    } catch { message.error('Error al eliminar') }
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({ ...record, groups: record.groups?.map(g => g.id) });
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const roleColors = { admin: 'red', manager: 'blue', resolver: 'green', end_user: 'default' };

  const columns = [
    { title: 'Nombre', dataIndex: 'full_name', key: 'full_name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Rol', dataIndex: 'role', key: 'role',
      render: (v) => <Tag color={roleColors[v]}>{ROLE_LABELS[v]}</Tag>,
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
          <Popconfirm title="¿Eliminar?" onConfirm={() => handleDelete(r.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>Usuarios</Typography.Title>
      <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ marginBottom: 16 }}>
        Nuevo Usuario
      </Button>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editing ? 'Editar Usuario' : 'Nuevo Usuario'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); }}
        onOk={() => form.submit()}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="organization_id" label="Organización" rules={[{ required: true }]}>
            <Select options={orgs.map(o => ({ label: o.name, value: o.id }))} />
          </Form.Item>
          <Form.Item name="full_name" label="Nombre Completo" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label={editing ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña'}
            rules={editing ? [] : [{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="Rol" rules={[{ required: true }]}>
            <Select options={Object.entries(ROLE_LABELS).map(([k, v]) => ({ label: v, value: k }))} />
          </Form.Item>
          <Form.Item name="phone" label="Teléfono">
            <Input />
          </Form.Item>
          <Form.Item name="groups" label="Grupos de Soporte">
            <Select mode="multiple" options={groups.map(g => ({ label: g.name, value: g.id }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
