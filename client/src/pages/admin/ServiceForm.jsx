import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, TreeSelect, Switch, Button, Card, Space, message, Typography, Divider, Spin, Modal } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, PlusOutlined, ApartmentOutlined, FormOutlined } from '@ant-design/icons';
import api from '../../api/client';

export default function ServiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [cats, setCats] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [formTemplates, setFormTemplates] = useState([]);
  const [groups, setGroups] = useState([]);
  const [wfModalOpen, setWfModalOpen] = useState(false);
  const [wfCreating, setWfCreating] = useState(false);
  const [ftModalOpen, setFtModalOpen] = useState(false);
  const [ftCreating, setFtCreating] = useState(false);
  const [wfForm] = Form.useForm();
  const [ftForm] = Form.useForm();
  const [form] = Form.useForm();
  const workflowId = Form.useWatch('workflow_id', form);
  const formTemplateId = Form.useWatch('form_template_id', form);

  const catTreeData = useMemo(() => {
    const filtered = cats.filter(c => c.type === 'service' || c.type === 'both');
    const map = {};
    const roots = [];
    filtered.forEach(c => { map[c.id] = { key: c.id, value: c.id, title: c.name }; });
    filtered.forEach(c => {
      if (c.parent_id && map[c.parent_id]) {
        if (!map[c.parent_id].children) map[c.parent_id].children = [];
        map[c.parent_id].children.push(map[c.id]);
      } else if (!c.parent_id) {
        roots.push(map[c.id]);
      }
    });
    return roots;
  }, [cats]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [orgsRes, catsRes, wfRes, ftRes, grpRes] = await Promise.all([
          api.get('/organizations'),
          api.get('/categories'),
          api.get('/workflows'),
          api.get('/form-templates'),
          api.get('/support-groups'),
        ]);
        setOrgs(orgsRes.data);
        setCats(catsRes.data);
        setWorkflows(wfRes.data);
        setFormTemplates(ftRes.data);
        setGroups(grpRes.data);

        if (isEditing) {
          const svcRes = await api.get(`/services/${id}`);
          const svc = svcRes.data;
          form.setFieldsValue({
            ...svc,
            organization_ids: svc.organizations?.map(o => o.id) || [],
          });
        }

        const draft = sessionStorage.getItem('service_form_draft');
        if (draft) {
          sessionStorage.removeItem('service_form_draft');
          const parsed = JSON.parse(draft);
          if ((!isEditing || parsed._return_to_id === id) && parsed.organization_ids?.length) {
            form.setFieldsValue(parsed);
          }
        }
      } catch { message.error('Error al cargar datos') }
      finally { setLoading(false) }
    };
    load();
  }, [id]);

  const handleCreateWorkflow = async (values) => {
    setWfCreating(true);
    try {
      const res = await api.post('/workflows', values);
      message.success('Flujo creado');
      setWorkflows(prev => [...prev, res.data]);
      form.setFieldsValue({ workflow_id: res.data.id });
      setWfModalOpen(false);
      wfForm.resetFields();
    } catch (err) {
      message.error(err.response?.data?.error || 'Error al crear flujo');
    } finally {
      setWfCreating(false);
    }
  };

  const handleCreateFormTemplate = async (values) => {
    setFtCreating(true);
    try {
      const res = await api.post('/form-templates', { ...values, config: [] });
      message.success('Formulario creado');
      setFormTemplates(prev => [...prev, res.data]);
      form.setFieldsValue({ form_template_id: res.data.id });
      setFtModalOpen(false);
      ftForm.resetFields();
    } catch (err) {
      message.error(err.response?.data?.error || 'Error al crear formulario');
    } finally {
      setFtCreating(false);
    }
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/services/${id}`, values);
        message.success('Servicio actualizado');
      } else {
        await api.post('/services', values);
        message.success('Servicio creado');
      }
      navigate('/admin/services');
    } catch (err) {
      message.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/services')}>Volver</Button>
      </Space>
      <Card>
        <Typography.Title level={4}>{isEditing ? 'Editar Servicio' : 'Nuevo Servicio'}</Typography.Title>
        {loading ? <Spin style={{ display: 'block', margin: '40px auto' }} /> : (
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
              <TreeSelect treeData={catTreeData} allowClear treeDefaultExpandAll placeholder="Seleccionar categoría..." />
            </Form.Item>
            <Form.Item label="Flujo de Trabajo">
              <div style={{ display: 'flex', gap: 4 }}>
                <div style={{ flex: 1 }}>
                  <Form.Item name="workflow_id" noStyle>
                    <Select
                      allowClear placeholder="Seleccionar flujo..." style={{ width: '100%' }}
                      options={workflows.filter(w => w.is_active !== false).map(w => ({ label: w.name, value: w.id }))} />
                  </Form.Item>
                </div>
                <Button icon={<PlusOutlined />} onClick={() => setWfModalOpen(true)} title="Crear nuevo flujo" />
                {workflowId && (
                  <Button icon={<ApartmentOutlined />}
                    onClick={() => {
                      const vals = form.getFieldsValue();
                      sessionStorage.setItem('service_form_draft', JSON.stringify({ ...vals, _return_to_id: id }));
                      navigate(`/admin/workflows/${workflowId}/design?return_to=${isEditing ? `/admin/services/${id}/edit` : '/admin/services/new'}`);
                    }} title="Diseñar flujo" />
                )}
              </div>
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

            <Divider>Formulario</Divider>
            <Form.Item label="Formulario">
              <div style={{ display: 'flex', gap: 4 }}>
                <div style={{ flex: 1 }}>
                  <Form.Item name="form_template_id" noStyle>
                    <Select allowClear placeholder="Seleccionar formulario..." style={{ width: '100%' }}
                      options={formTemplates.filter(t => t.is_active !== false).map(t => ({ label: t.name, value: t.id }))} />
                  </Form.Item>
                </div>
                <Button icon={<PlusOutlined />} onClick={() => setFtModalOpen(true)} title="Crear nuevo formulario" />
                {formTemplateId && (
                  <Button icon={<FormOutlined />}
                    onClick={() => {
                      const vals = form.getFieldsValue();
                      sessionStorage.setItem('service_form_draft', JSON.stringify({ ...vals, _return_to_id: id }));
                      navigate(`/admin/form-templates/${formTemplateId}/design?return_to=${isEditing ? `/admin/services/${id}/edit` : '/admin/services/new'}`);
                    }} title="Diseñar formulario" />
                )}
              </div>
            </Form.Item>

            {/* hidden fields for backward compatibility */}
            <Form.Item name="form_config" hidden><Input /></Form.Item>
            <Form.Item name="workflow_config" hidden><Input /></Form.Item>

            <Divider />
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} size="large">
              {isEditing ? 'Actualizar Servicio' : 'Crear Servicio'}
            </Button>
          </Form>
        )}
      </Card>

      <Modal
        title="Nuevo Flujo de Trabajo"
        open={wfModalOpen}
        onCancel={() => { setWfModalOpen(false); wfForm.resetFields(); }}
        onOk={() => wfForm.submit()}
        confirmLoading={wfCreating}
      >
        <Form form={wfForm} layout="vertical" onFinish={handleCreateWorkflow}>
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Descripción">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Nuevo Formulario"
        open={ftModalOpen}
        onCancel={() => { setFtModalOpen(false); ftForm.resetFields(); }}
        onOk={() => ftForm.submit()}
        confirmLoading={ftCreating}
      >
        <Form form={ftForm} layout="vertical" onFinish={handleCreateFormTemplate}>
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
