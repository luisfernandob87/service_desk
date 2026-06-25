import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Avatar, Dropdown, Space } from 'antd';
import NotificationBell from '../components/NotificationBell';
import {
  DashboardOutlined,
  ApartmentOutlined,
  TeamOutlined,
  UserOutlined,
  AppstoreOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ToolOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PartitionOutlined,
  LayoutOutlined,
  BugOutlined,
  SwapOutlined,
  ExclamationCircleOutlined,
  SendOutlined,
  FormOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS } from '../utils/constants';

const { Header, Sider, Content } = Layout;

const allMenuItems = [
  { key: '/admin', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: 'div1', type: 'divider' },
  { key: 'modulos', label: 'MÓDULOS', type: 'group' },
  { key: '/admin/peticiones', icon: <SendOutlined />, label: 'Peticiones' },
  { key: '/admin/incidentes', icon: <BugOutlined />, label: 'Incidentes' },
  { key: '/admin/ordenes-trabajo', icon: <ToolOutlined />, label: 'Órdenes de Trabajo' },
  { key: '/admin/solicitudes-cambio', icon: <SwapOutlined />, label: 'Solicitudes de Cambio' },
  { key: '/admin/problemas', icon: <ExclamationCircleOutlined />, label: 'Problemas' },
  { key: '/admin/aprobaciones', icon: <CheckCircleOutlined />, label: 'Aprobaciones' },
  { key: 'div2', type: 'divider' },
  { key: 'admin', label: 'ADMINISTRACIÓN', type: 'group' },
  { key: '/admin/organizations', icon: <ApartmentOutlined />, label: 'Organizaciones' },
  { key: '/admin/groups', icon: <TeamOutlined />, label: 'Grupos de Soporte' },
  { key: '/admin/users', icon: <UserOutlined />, label: 'Usuarios' },
  { key: '/admin/categories', icon: <AppstoreOutlined />, label: 'Categorías' },
  { key: '/admin/services', icon: <ToolOutlined />, label: 'Servicios' },
  { key: 'div3', type: 'divider' },
  { key: 'config', label: 'CONFIGURACIÓN', type: 'group' },
  { key: '/admin/sla', icon: <ClockCircleOutlined />, label: 'SLA' },
  { key: '/admin/business-hours', icon: <ClockCircleOutlined />, label: 'Horarios' },
  { key: '/admin/workflows', icon: <PartitionOutlined />, label: 'Workflows' },
  { key: '/admin/form-templates', icon: <FormOutlined />, label: 'Formularios' },
  { key: '/admin/landing', icon: <LayoutOutlined />, label: 'Landing Page' },
];

const resolverItems = [
  { key: '/admin', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: 'div1', type: 'divider' },
  { key: 'modulos', label: 'MÓDULOS', type: 'group' },
  { key: '/admin/peticiones', icon: <SendOutlined />, label: 'Peticiones' },
  { key: '/admin/incidentes', icon: <BugOutlined />, label: 'Incidentes' },
  { key: '/admin/ordenes-trabajo', icon: <ToolOutlined />, label: 'Órdenes de Trabajo' },
  { key: '/admin/solicitudes-cambio', icon: <SwapOutlined />, label: 'Solicitudes de Cambio' },
  { key: '/admin/problemas', icon: <ExclamationCircleOutlined />, label: 'Problemas' },
  { key: '/admin/aprobaciones', icon: <CheckCircleOutlined />, label: 'Aprobaciones' },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const menuItems = user?.role === 'resolver' ? resolverItems : allMenuItems;
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
          items={menuItems}
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
                { key: 'landing', label: 'Ver Landing Page', icon: <EyeOutlined /> },
                { type: 'divider' },
                { key: 'logout', icon: <LogoutOutlined />, label: 'Cerrar Sesión' },
              ],
              onClick: ({ key }) => {
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
