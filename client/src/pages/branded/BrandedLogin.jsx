import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Alert, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

export default function BrandedLogin() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(false);
  const [orgLoading, setOrgLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const [org, setOrg] = useState(null);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const cfg = org?.login_config || {};

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/organizations/by-slug/${slug}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setOrg(data);
      } catch {
        setError('Organización no encontrada');
      } finally {
        setOrgLoading(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (user) {
      const redirect = searchParams.get('redirect');
      if (redirect) {
        navigate(redirect, { replace: true });
      } else if (user.role === 'end_user') {
        navigate(`/org/${user.org_slug}`, { replace: true });
      } else if (user.role === 'resolver') {
        navigate('/support', { replace: true });
      } else {
        navigate('/admin', { replace: true });
      }
    }
  }, [user]);

  const handleSubmit = async (values) => {
    setLoading(true);
    setError('');
    try {
      const data = await login(values.email, values.password);
      const redirect = searchParams.get('redirect');
      if (redirect) return navigate(redirect);
      if (data.user.role === 'end_user') {
        navigate(`/org/${data.user.org_slug}`);
      } else if (data.user.role === 'resolver') {
        navigate('/support');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  if (orgLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: cfg.bg_color || '#f0f2f5' }}>
        <Spin size="large" />
      </div>
    );
  }

  const bgStyle = cfg.bg_image
    ? { backgroundImage: `url(${cfg.bg_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: cfg.bg_color || '#f0f2f5' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', ...bgStyle }}>
      <Card style={{ width: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
        {cfg.logo_url && (
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <img src={cfg.logo_url} alt="Logo" style={{ maxHeight: 64, maxWidth: 200 }} />
          </div>
        )}
        {cfg.title && (
          <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: cfg.subtitle ? 0 : 24 }}>
            {cfg.title}
          </Typography.Title>
        )}
        {cfg.subtitle && (
          <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
            {cfg.subtitle}
          </Typography.Text>
        )}
        {!cfg.title && !cfg.logo_url && (
          <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
            {org?.name || 'Service Desk'}
          </Typography.Title>
        )}
        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
        <Form onFinish={handleSubmit} layout="vertical" size="large">
          <Form.Item name="email" rules={[{ required: true, message: 'Ingresa tu email' }]}>
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Ingresa tu contraseña' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Contraseña" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}
              style={cfg.primary_color ? { background: cfg.primary_color, borderColor: cfg.primary_color } : {}}>
              {cfg.button_text || 'Iniciar Sesión'}
            </Button>
          </Form.Item>
        </Form>
        {cfg.footer_text && (
          <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', fontSize: 12 }}>
            {cfg.footer_text}
          </Typography.Text>
        )}
      </Card>
    </div>
  );
}