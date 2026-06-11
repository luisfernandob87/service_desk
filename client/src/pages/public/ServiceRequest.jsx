import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, Typography, Form, Input, Select, Radio, DatePicker, Button, Spin, message, Alert, Checkbox, Switch, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { PRIORITIES } from '../../utils/constants';

const { TextArea } = Input;

const SYSTEM_OPTIONS = {
  priority: Object.entries(PRIORITIES).map(([value, label]) => ({ label, value })),
};

export default function ServiceRequest() {
  const { slug, id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [service, setService] = useState(null);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const orgRes = await api.get(`/organizations/by-slug/${slug}`);
        if (!orgRes.data) return;
        setOrg(orgRes.data);
        const res = await api.get(`/services/published/${orgRes.data.id}/${id}`);
        setService(res.data);
      } catch { message.error('Error al cargar servicio') }
      finally { setLoading(false) }
    })();
  }, [slug, id]);

  useEffect(() => {
    const prefill = location.state?.prefill;
    if (!prefill || !service) return;
    const values = {};
    for (const field of (service.form_config || [])) {
      if (field.type === 'file') continue;
      if (field.system) {
        values[field.name] = prefill[field.name] || '';
      } else {
        const val = prefill.form_data?.[field.name];
        if (val !== undefined) values[['form_data', field.name]] = val;
      }
    }
    form.setFieldsValue(values);
  }, [service, location.state]);

  const handleSubmit = async (values) => {
    if (!user) { navigate(`/login?redirect=/org/${slug}/services/${id}`); return; }
    setSubmitting(true);
    try {
      const orgId = org?.id;
      const fields = (service.form_config || []).filter(f => !f.hidden);
      const fileFields = fields.filter(f => f.type === 'file' && f.name !== 'attachments');

      const formData = { ...(values.form_data || {}) };
      for (const ff of fileFields) {
        delete formData[ff.name];
      }

      let title = values.title || 'Solicitud';
      let priority = 'medium';

      for (const f of fields) {
        if (f.name === 'title' && values[f.name]) title = values[f.name];
        if (f.name === 'priority' && values[f.name]) priority = values[f.name];
      }

      const payload = {
        organization_id: orgId,
        service_id: service.id,
        title,
        priority,
        description: values.description || '',
        form_data: formData,
      };

      const firstNonStart = service.workflow?.nodes?.find(n => n.data?.nodeType !== 'start');
      payload.type = firstNonStart?.data?.nodeType || 'incident';

      const res = await api.post('/tickets', payload);
      const data = res.data;

      if (data.execution) {
        message.success('Solicitud creada exitosamente');
        navigate(`/my-requests`);
        return;
      }

      const ticket = data;
      const fileRefs = { ...formData };

      for (const ff of fileFields) {
        const fileObj = values.form_data?.[ff.name]?.fileList?.[0]?.originFileObj;
        if (fileObj) {
          const fd = new FormData();
          fd.append('file', fileObj);
          const uploadRes = await api.post(`/tickets/${ticket.id}/attachments`, fd);
          fileRefs[ff.name] = uploadRes.data.filename;
        }
      }

      for (const ff of fields.filter(f => f.name === 'attachments')) {
        const fileList = values[ff.name]?.fileList || [];
        for (const fileItem of fileList) {
          if (fileItem.originFileObj) {
            const fd = new FormData();
            fd.append('file', fileItem.originFileObj);
            await api.post(`/tickets/${ticket.id}/attachments`, fd);
          }
        }
      }

      if (fileFields.some(ff => fileRefs[ff.name]) || Object.keys(fileRefs).length !== Object.keys(formData).length) {
        await api.patch(`/tickets/${ticket.id}/form-data`, { form_data: fileRefs });
      }

      message.success('Solicitud creada exitosamente');
      navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      message.error(err.response?.data?.error || 'Error al crear solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    if (field.hidden) return null;

    const isSystem = field.system;
    const fieldName = isSystem ? field.name : ['form_data', field.name];

    if (field.name === 'attachments' && field.type === 'file') {
      return (
        <Form.Item key={field.name} name={fieldName} label={field.label} valuePropName="fileList">
          <Upload maxCount={5} beforeUpload={() => false} multiple>
            <Button icon={<UploadOutlined />}>Seleccionar archivos</Button>
          </Upload>
        </Form.Item>
      );
    }

    if (field.name === 'priority') {
      return (
        <Form.Item key={field.name} name={fieldName} label={field.label}
          rules={field.required ? [{ required: true }] : []}
          initialValue="medium">
          <Select options={SYSTEM_OPTIONS.priority} />
        </Form.Item>
      );
    }

    if (field.name === 'title') {
      return (
        <Form.Item key={field.name} name={fieldName} label={field.label}
          rules={field.required ? [{ required: true, message: 'Campo requerido' }] : []}>
          <Input placeholder={field.placeholder} />
        </Form.Item>
      );
    }

    if (field.name === 'description') {
      return (
        <Form.Item key={field.name} name={fieldName} label={field.label}>
          <TextArea rows={4} placeholder={field.placeholder} />
        </Form.Item>
      );
    }

    return (
      <Form.Item key={field.name}
        name={fieldName}
        label={field.label}
        rules={field.required ? [{ required: true, message: `${field.label} es requerido` }] : []}
        valuePropName={field.type === 'checkbox' || field.type === 'boolean' ? 'checked' : field.type === 'file' ? 'fileList' : undefined}>
        {field.type === 'select' ? (
          <Select options={(field.options || []).map(o => ({ label: o, value: o }))} placeholder={field.placeholder} />
        ) : field.type === 'radio' ? (
          <Radio.Group options={field.options || []} />
        ) : field.type === 'checkbox' ? (
          <Checkbox>{field.label}</Checkbox>
        ) : field.type === 'boolean' ? (
          <Switch checkedChildren="Verdadero" unCheckedChildren="Falso" />
        ) : field.type === 'date' ? (
          <DatePicker style={{ width: '100%' }} />
        ) : field.type === 'textarea' ? (
          <TextArea rows={3} placeholder={field.placeholder} />
        ) : field.type === 'file' ? (
          <Upload maxCount={1} beforeUpload={() => false}>
            <Button icon={<UploadOutlined />}>Seleccionar archivo</Button>
          </Upload>
        ) : (
          <Input placeholder={field.placeholder} />
        )}
      </Form.Item>
    );
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!service) return <div style={{ textAlign: 'center', padding: 80 }}><Typography.Text type="danger">Servicio no encontrado</Typography.Text></div>;

  const fields = service.form_config || [];

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px' }}>
      {!user && (
        <Alert
          message="Debes iniciar sesión para crear una solicitud"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={<Button size="small" onClick={() => navigate(`/login?redirect=/org/${slug}/services/${id}`)}>Iniciar Sesión</Button>}
        />
      )}

      <Card>
        <Typography.Title level={4}>{service.name}</Typography.Title>
        {service.description && <Typography.Paragraph>{service.description}</Typography.Paragraph>}

        <Form form={form} layout="vertical" onFinish={handleSubmit} disabled={!user}>
          {fields.map(renderField)}

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={submitting} disabled={!user}>
              Enviar Solicitud
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
