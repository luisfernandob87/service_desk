import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Space, message, Typography, Spin, Card } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../api/client';
import WorkflowEditor from '../../components/WorkflowEditor';

export default function WorkflowDesigner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('return_to');
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/workflows/${id}`);
        setWorkflow(res.data);
      } catch { message.error('Error al cargar el flujo') }
      finally { setLoading(false) }
    };
    load();
  }, [id]);

  const handleEditorSave = async (config) => {
    setSaving(true);
    try {
      await api.put(`/workflows/${id}`, config);
      message.success('Diagrama guardado');
    } catch (err) {
      message.error(err.response?.data?.error || 'Error al guardar diagrama');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin style={{ display: 'block', margin: '40px auto' }} />;

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(returnTo || '/admin/workflows')}>Volver</Button>
        <Typography.Title level={4} style={{ margin: 0 }}>{workflow?.name}</Typography.Title>
      </Space>
      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column' }} styles={{ body: { flex: 1, padding: 0 } }}>
        <WorkflowEditor
          value={{ nodes: workflow?.nodes || [], edges: workflow?.edges || [] }}
          onChange={handleEditorSave}
        />
      </Card>
    </div>
  );
}
