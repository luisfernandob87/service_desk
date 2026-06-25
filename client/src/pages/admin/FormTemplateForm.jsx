import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Switch, Button, Card, Space, message, Typography, Divider, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../api/client';
import FormBuilder from '../../components/FormBuilder';

export default function FormTemplateForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!isEditing) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/form-templates/${id}`);
        form.setFieldsValue(res.data);
      } catch { message.error('Error al cargar') }
      finally { setLoading(false) }
    };
    load();
  }, [id]);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/form-templates/${id}`, values);
        message.success('Formulario actualizado');
      } else {
        await api.post('/form-templates', values);
        message.success('Formulario creado');
      }
      navigate('/admin/form-templates');
    } catch (err) {
      message.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/form-templates')}>Volver</Button>
      </Space>
      <Card>
        <Typography.Title level={4}>{isEditing ? 'Editar Formulario' : 'Nuevo Formulario'}</Typography.Title>
        {loading ? <Spin style={{ display: 'block', margin: '40px auto' }} /> : (
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="description" label="Descripción">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item name="is_active" label="Activo" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Divider>Campos del Formulario</Divider>
            <Form.Item name="config" hidden>
              <Input />
            </Form.Item>
            <Form.Item shouldUpdate={(prev, cur) => prev.config !== cur.config}>
              {({ getFieldValue, setFieldsValue }) => (
                <FormBuilder
                  value={getFieldValue('config') || []}
                  onChange={(fields) => setFieldsValue({ config: fields })}
                />
              )}
            </Form.Item>

            <Divider />
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} size="large">
              {isEditing ? 'Actualizar Formulario' : 'Crear Formulario'}
            </Button>
          </Form>
        )}
      </Card>
    </div>
  );
}
