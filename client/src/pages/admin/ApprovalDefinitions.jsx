import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../api/client';

export default function ApprovalDefinitions() {
  const [data, setData] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [stagesText, setStagesText] = useState('');
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [defRes, svcRes] = await Promise.all([
        api.get('/approvals/definitions'),
        api.get('/services'),
      ]);
      setData(defRes.data);
      setServices(svcRes.data);
    } catch { message.error('Error al cargar') }
    finally { setLoading(false) }
  };

  useEffect(() => { loadData() }, []);

  const handleSave = async (values) => {
    try {
      const stages = stagesText.split('\n').filter(Boolean).map((name, i) => ({ name: name.trim(), order: i + 1 }));
      const payload = { ...values, stages };
      if (editing) {
        await api.put(`/approvals/definitions/${editing.id}`, payload);
        message.success('Definición actualizada');
      } else {
        await api.post('/approvals/definitions', payload);
        message.success('Definición creada');
      }
      setModalOpen(false);
      form.resetFields();
      setStagesText('');
      setEditing(null);
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/approvals/definitions/${id}`);
      message.success('Definición eliminada');
      loadData();
    } catch { message.error('Error al eliminar') }
  };

  const openEdit = (record) => {
    setEditing(record);
    setStagesText((record.stages || []).map(s => s.name).join('\n'));
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setStagesText('');
    form.resetFields();
    setModalOpen(true);
  };

  const columns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    {
      title: 'Servicio', key: 'service',
      render: (_, r) => r.service?.name || '-',
    },
    {
      title: 'Etapas', key: 'stages',
      render: (_, r) => (r.stages || []).map(s => <Tag key={s.name}>{s.name}</Tag>),
    },
    {
      title: 'Activo', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: (v) => v ? <Tag color="green">Sí</Tag> : <Tag color="red">No</Tag>,
    },
    {
      title: 'Acciones', key: 'actions', width: 120,
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
      <Typography.Title level={4}>Definiciones de Aprobación</Typography.Title>
      <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ marginBottom: 16 }}>
        Nueva Definición
      </Button>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editing ? 'Editar Definición' : 'Nueva Definición'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); }}
        onOk={() => form.submit()}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="service_id" label="Servicio" rules={[{ required: true }]}>
            <Select options={services.map(s => ({ label: s.name, value: s.id }))} />
          </Form.Item>
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Etapas (una por línea)" rules={[{ required: true, message: 'Al menos una etapa' }]}>
            <Input.TextArea
              rows={4}
              value={stagesText}
              onChange={e => setStagesText(e.target.value)}
              placeholder="Jefatura&#10;Gerencia&#10;Dirección"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
