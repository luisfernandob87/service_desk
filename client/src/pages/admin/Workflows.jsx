import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Modal, Form, Input, Switch, Space, Popconfirm, message, Tag, Typography, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ApartmentOutlined } from '@ant-design/icons';
import api from '../../api/client';

const NODE_LABELS = {
  start: 'Inicio',
  incident: 'Incidente',
  work_order: 'Orden Trabajo',
  change_request: 'Solicitud Cambio',
  problem: 'Problema',
  approval: 'Aprobación',
  notification: 'Notificación',
  condition: 'Condición',
  end: 'Fin',
};

const NODE_COLORS = {
  start: 'green',
  incident: 'red',
  work_order: 'purple',
  change_request: 'gold',
  problem: 'volcano',
  approval: 'blue',
  notification: 'magenta',
  condition: 'green',
  end: 'default',
};

export default function Workflows() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterActive, setFilterActive] = useState(true);
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/workflows');
      setData(res.data);
    } catch { message.error('Error al cargar') }
    finally { setLoading(false) }
  }, []);

  useEffect(() => { loadData() }, [loadData]);

  const handleSave = async (values) => {
    try {
      if (editing) {
        await api.put(`/workflows/${editing.id}`, { ...values, organization_id: editing.organization_id });
        message.success('Flujo actualizado');
      } else {
        await api.post('/workflows', values);
        message.success('Flujo creado');
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
      await api.delete(`/workflows/${id}`);
      message.success('Flujo eliminado');
      loadData();
    } catch { message.error('Error al eliminar') }
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      is_active: record.is_active !== false,
    });
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const filteredData = filterActive ? data.filter(w => w.is_active !== false) : data;

  const getNodeTypesSummary = (nodes) => {
    if (!nodes?.length) return '-';
    const types = [...new Set(nodes.map(n => n.data?.nodeType))];
    return types.map(t => (
      <Tag key={t} color={NODE_COLORS[t]}>{NODE_LABELS[t] || t}</Tag>
    ));
  };

  const columns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Descripción', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'Nodos', key: 'nodes', width: 200,
      render: (_, r) => getNodeTypesSummary(r.nodes),
    },
    {
      title: 'Activo', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: (v) => v === false ? <Tag color="red">No</Tag> : <Tag color="green">Sí</Tag>,
    },
    {
      title: 'Acciones', key: 'actions', width: 180,
      render: (_, r) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
          <Button icon={<ApartmentOutlined />} size="small" onClick={() => navigate(`/admin/workflows/${r.id}/design`)}>Diseñar</Button>
          <Popconfirm title="¿Eliminar?" onConfirm={() => handleDelete(r.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>Flujos de Trabajo</Typography.Title>
      <Typography.Paragraph type="secondary">
        Los flujos definen el proceso de atención de un servicio. Para asignar un SLA a un nodo, edítelo en el diseñador visual.
      </Typography.Paragraph>
      <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ marginBottom: 16 }}>
        Nuevo Flujo
      </Button>
      <Space style={{ marginBottom: 16 }}>
        <Select value={filterActive} onChange={setFilterActive} style={{ width: 140 }}
          options={[
            { label: 'Activos', value: true },
            { label: 'Todos', value: false },
          ]} />
      </Space>
      <Table
        dataSource={filteredData}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editing ? 'Editar Flujo' : 'Nuevo Flujo'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Descripción">
            <Input.TextArea rows={3} />
          </Form.Item>
          {editing && (
            <Form.Item name="is_active" label="Activo" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}