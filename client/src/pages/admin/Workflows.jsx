import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, message, Tag, Typography, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ApartmentOutlined } from '@ant-design/icons';
import api from '../../api/client';
import WorkflowEditor from '../../components/WorkflowEditor';

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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editorWorkflow, setEditorWorkflow] = useState(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/workflows');
      setData(res.data);
    } catch { message.error('Error al cargar') }
    finally { setLoading(false) }
  };

  useEffect(() => { loadData() }, []);

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
    });
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditor = (record) => {
    setEditorWorkflow(record);
    setEditorOpen(true);
  };

  const handleEditorSave = async (config) => {
    try {
      await api.put(`/workflows/${editorWorkflow.id}`, config);
      message.success('Diagrama guardado');
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || 'Error al guardar diagrama');
    }
  };

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
      title: 'Activo', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: (v) => v === false ? <Tag color="red">No</Tag> : <Tag color="green">Sí</Tag>,
    },
    {
      title: 'Acciones', key: 'actions', width: 180,
      render: (_, r) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
          <Button icon={<ApartmentOutlined />} size="small" onClick={() => openEditor(r)}>Diseñar</Button>
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
        Los flujos definen el proceso de atención de un servicio: desde la creación del ticket, aprobaciones,
        notificaciones y más.
      </Typography.Paragraph>
      <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ marginBottom: 16 }}>
        Nuevo Flujo
      </Button>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

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
        </Form>
      </Modal>

      <Modal
        title={`Editor de flujo — ${editorWorkflow?.name || ''}`}
        open={editorOpen}
        onCancel={() => { setEditorOpen(false); setEditorWorkflow(null); }}
        width="90vw"
        style={{ top: 20 }}
        footer={null}
        destroyOnClose
      >
        {editorWorkflow && (
          <div style={{ height: '70vh' }} key={editorWorkflow.id}>
            <WorkflowEditor
              value={{ nodes: editorWorkflow.nodes, edges: editorWorkflow.edges }}
              onChange={handleEditorSave}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
