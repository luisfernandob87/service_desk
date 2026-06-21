import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, Space, message, Tag, Typography, Divider } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../../api/client';
import FormBuilder from '../../components/FormBuilder';

export default function AdminServices() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [cats, setCats] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filterPublished, setFilterPublished] = useState(true);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [svcRes, orgsRes, catsRes, wfRes, grpRes] = await Promise.all([
        api.get('/services'),
        api.get('/organizations'),
        api.get('/categories'),
        api.get('/workflows'),
        api.get('/support-groups'),
      ]);
      setGroups(grpRes.data);
      setData(svcRes.data);
      setOrgs(orgsRes.data);
      setCats(catsRes.data);
      setWorkflows(wfRes.data);
    } catch { message.error('Error al cargar') }
    finally { setLoading(false) }
  };

  useEffect(() => { loadData() }, []);

  const handleSave = async (values) => {
    try {
      if (editing) {
        await api.put(`/services/${editing.id}`, values);
        message.success('Servicio actualizado');
      } else {
        await api.post('/services', values);
        message.success('Servicio creado');
      }
      setModalOpen(false);
      form.resetFields();
      setEditing(null);
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || 'Error al guardar');
    }
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

  const filteredData = filterPublished ? data.filter(s => s.is_published) : data;

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
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>Servicios</Typography.Title>
      <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ marginBottom: 16 }}>
        Nuevo Servicio
      </Button>
      <Space style={{ marginBottom: 16 }}>
        <Select value={filterPublished} onChange={setFilterPublished} style={{ width: 160 }}
          options={[
            { label: 'Publicados', value: true },
            { label: 'Todos', value: false },
          ]} />
      </Space>
      <Table dataSource={filteredData} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editing ? 'Editar Servicio' : 'Nuevo Servicio'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="organization_ids" label="Organizaciones" rules={[{ required: true, message: 'Selecciona al menos una' }]}>
            <Select mode="multiple" options={orgs.map(o => ({ label: o.name, value: o.id }))} />
          </Form.Item>
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="short_description" label="Descripción Corta">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Descripción">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="category_id" label="Categoría">
            <Select allowClear options={cats.map(c => ({ label: c.name, value: c.id }))} />
          </Form.Item>
          <Form.Item name="workflow_id" label="Flujo de Trabajo">
            <Select allowClear placeholder="Seleccionar flujo..."
              options={workflows.filter(w => w.is_active !== false).map(w => ({ label: w.name, value: w.id }))} />
          </Form.Item>
          <Form.Item name="default_assigned_group_id" label="Grupo de Soporte (Owner)">
            <Select allowClear placeholder="Grupo que dará seguimiento..."
              options={groups.map(g => ({ label: g.name, value: g.id }))} />
          </Form.Item>
          <Form.Item name="icon" label="Icono">
            <Select allowClear options={[
              { label: '💻 Laptop', value: 'laptop' },
              { label: '📦 Software', value: 'software' },
              { label: '🌐 Red', value: 'network' },
              { label: '🖨️ Impresora', value: 'printer' },
              { label: '📞 Teléfono', value: 'phone' },
              { label: '🔧 General', value: 'default' },
            ]} />
          </Form.Item>
          <Form.Item name="is_published" label="Publicado" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Divider>Formulario Personalizado</Divider>
          <Form.Item name="form_config" hidden>
            <Input />
          </Form.Item>
          <Form.Item shouldUpdate={(prev, cur) => prev.form_config !== cur.form_config}>
            {({ getFieldValue, setFieldsValue }) => (
              <FormBuilder
                value={getFieldValue('form_config') || []}
                onChange={(fields) => setFieldsValue({ form_config: fields })}
              />
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
