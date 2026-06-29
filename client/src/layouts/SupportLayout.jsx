import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Avatar, Dropdown, Space } from 'antd';
import NotificationBell from '../components/NotificationBell';
import {
  DashboardOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  EyeOutlined,
  BugOutlined,
  SwapOutlined,
  ExclamationCircleOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ToolOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS } from '../utils/constants';

const { Header, Sider, Content } = Layout;

const supportMenuItems = [
  { key: '/support', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: 'div1', type: 'divider' },
  { key: 'modulos', label: 'MÓDULOS', type: 'group' },
  { key: '/support/peticiones', icon: <SendOutlined />, label: 'Peticiones' },
  { key: '/support/incidentes', icon: <BugOutlined />, label: 'Incidentes' },
  { key: '/support/ordenes-trabajo', icon: <ToolOutlined />, label: 'Órdenes de Trabajo' },
  { key: '/support/solicitudes-cambio', icon: <SwapOutlined />, label: 'Solicitudes de Cambio' },
  { key: '/support/problemas', icon: <ExclamationCircleOutlined />, label: 'Problemas' },
  { key: '/support/aprobaciones', icon: <CheckCircleOutlined />, label: 'Aprobaciones' },
];

export default function SupportLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = '/' + location.pathname.split('/').slice(1, 3).join('/');

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
            {collapsed ? 'SD' : 'Service Desk'}
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={supportMenuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Space>
            <NotificationBell />
            <Dropdown
              menu={{
              items: [
                { key: 'role', label: ROLE_LABELS[user?.role], disabled: true },
                ...(user?.role === 'admin' || user?.role === 'manager'
                  ? [{ key: 'admin', icon: <ApartmentOutlined />, label: 'Ir a Admin' }]
                  : []),
                { key: 'landing', icon: <EyeOutlined />, label: 'Ver Landing Page' },
                { type: 'divider' },
                { key: 'logout', icon: <LogoutOutlined />, label: 'Cerrar Sesión' },
              ],
              onClick: ({ key }) => {
                if (key === 'admin') navigate('/admin');
                if (key === 'landing') window.open(`/org/${user?.org_slug}`, '_blank');
                if (key === 'logout') logout();
              },
            }}
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.full_name}</span>
            </Space>
          </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
