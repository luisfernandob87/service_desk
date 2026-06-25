import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Space, message, Typography, Spin, Card } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../api/client';
import FormBuilder from '../../components/FormBuilder';

export default function FormTemplateDesigner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('return_to');
  const [template, setTemplate] = useState(null);
  const [config, setConfig] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/form-templates/${id}`);
        setTemplate(res.data);
        setConfig(res.data.config || []);
      } catch { message.error('Error al cargar el formulario') }
      finally { setLoading(false) }
    };
    load();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/form-templates/${id}`, { config });
      message.success('Formulario guardado');
    } catch (err) {
      message.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {loading ? <Spin style={{ display: 'block', margin: '40px auto' }} /> : (
        <>
          <Space style={{ marginBottom: 16 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(returnTo || '/admin/form-templates')}>Volver</Button>
            <Typography.Title level={4} style={{ margin: 0 }}>{template?.name}</Typography.Title>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
              Guardar
            </Button>
          </Space>
          <Card>
            <FormBuilder
              value={config}
              onChange={(fields) => setConfig(fields)}
            />
          </Card>
        </>
      )}
    </div>
  );
}
