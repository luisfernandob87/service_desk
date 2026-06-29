import { Button, Card, Typography, Space } from 'antd';
import { LockOutlined, ApartmentOutlined, ToolOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AccessDenied() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const goTo = (path) => navigate(path);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ maxWidth: 440, textAlign: 'center' }}>
        <LockOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} />
        <Typography.Title level={4}>Acceso Denegado</Typography.Title>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          No tienes permisos para acceder a esta sección.
        </Typography.Text>
        <Space direction="vertical" style={{ width: '100%' }}>
          {user?.role !== 'end_user' && (
            <Button type="primary" icon={<HomeOutlined />} block
              onClick={() => goTo(`/org/${user.org_slug}`)}>
              Ir a Mi Portal
            </Button>
          )}
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <Button icon={<ApartmentOutlined />} block
              onClick={() => goTo('/admin')}>
              Ir a Administración
            </Button>
          )}
          {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'resolver') && (
            <Button icon={<ToolOutlined />} block
              onClick={() => goTo('/support')}>
              Ir a Soporte
            </Button>
          )}
        </Space>
      </Card>
    </div>
  );
}
