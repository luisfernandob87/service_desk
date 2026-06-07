import { useState } from 'react';
import { Outlet, Link, useParams } from 'react-router-dom';
import { Layout, Typography, Button, Dropdown, Space, Avatar, Modal, Form, Input, message } from 'antd';
import { UserOutlined, LogoutOutlined, KeyOutlined } from '@ant-design/icons';
import NotificationBell from '../components/NotificationBell';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

const { Header, Content } = Layout;

export default function PublicLayout() {
  const { slug } = useParams();
  const { user, logout } = useAuth();
  const homeSlug = user?.org_slug || slug || 'principal';
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdForm] = Form.useForm();
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleChangePassword = async (values) => {
    setPwdLoading(true);
    try {
      await api.put('/auth/password', values);
      message.success('Contraseña actualizada');
      setPwdOpen(false);
      pwdForm.resetFields();
    } catch (err) {
      message.error(err.response?.data?.error || 'Error al cambiar contraseña');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <Layout>
      <Header style={{ background: '#001529', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to={`/org/${homeSlug}`} style={{ color: '#fff', textDecoration: 'none' }}>
          <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>Service Desk</Typography.Title>
        </Link>
        <div>
          {user ? (
            <Space>
            <NotificationBell />
            <Dropdown
              menu={{
                items: [
                  { key: 'name', label: user.full_name, disabled: true },
                  { type: 'divider' },
                  { key: 'requests', label: 'Mis Solicitudes' },
                  { key: 'password', icon: <KeyOutlined />, label: 'Cambiar Contraseña' },
                  user.role !== 'end_user' && { key: 'admin', label: 'Admin' },
                  { type: 'divider' },
                  { key: 'logout', icon: <LogoutOutlined />, label: 'Cerrar Sesión', danger: true },
                ].filter(Boolean),
                onClick: ({ key }) => {
                  if (key === 'logout') logout();
                  if (key === 'password') setPwdOpen(true);
                  if (key === 'admin') window.location.href = '/admin';
                  if (key === 'requests') window.location.href = '/my-requests';
                },
              }}
            >
              <Space style={{ cursor: 'pointer', color: '#fff' }}>
                <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                {user.full_name}
              </Space>
            </Dropdown>
            </Space>
          ) : (
            <Button type="link" href="/login" style={{ color: '#fff' }}>Iniciar Sesión</Button>
          )}
        </div>
      </Header>

      <Modal
        title="Cambiar Contraseña"
        open={pwdOpen}
        onCancel={() => { setPwdOpen(false); pwdForm.resetFields(); }}
        onOk={() => pwdForm.submit()}
        confirmLoading={pwdLoading}
      >
        <Form form={pwdForm} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item name="current_password" label="Contraseña Actual" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="new_password" label="Nueva Contraseña" rules={[
            { required: true, min: 6, message: 'Mínimo 6 caracteres' },
          ]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="confirm_password" label="Confirmar Contraseña" dependencies={['new_password']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) return Promise.resolve();
                  return Promise.reject(new Error('Las contraseñas no coinciden'));
                },
              }),
            ]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>

      <Content style={{ minHeight: 'calc(100vh - 64px)', background: '#f0f2f5' }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
