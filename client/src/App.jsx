import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AccessDenied from './pages/AccessDenied';
import AdminLayout from './layouts/AdminLayout';
import SupportLayout from './layouts/SupportLayout';
import PublicLayout from './layouts/PublicLayout';
import Login from './pages/Login';
import ServiceCatalog from './pages/public/ServiceCatalog';
import ServiceRequest from './pages/public/ServiceRequest';
import MyRequests from './pages/user/MyRequests';
import UserRequestDetail from './pages/user/RequestDetail';
import TicketDetail from './pages/user/TicketDetail';
import Dashboard from './pages/admin/Dashboard';
import Organizations from './pages/admin/Organizations';
import OrganizationDetail from './pages/admin/OrganizationDetail';
import Users from './pages/admin/Users';
import Groups from './pages/admin/Groups';
import GroupDetail from './pages/admin/GroupDetail';
import UserDetail from './pages/admin/UserDetail';
import Categories from './pages/admin/Categories';
import AdminServices from './pages/admin/Services';
import ServiceForm from './pages/admin/ServiceForm';
import RequestsPage from './pages/admin/RequestsPage';
import RequestDetail from './pages/admin/RequestDetail';
import TicketTypePage from './pages/admin/TicketTypePage';
import ApprovalsPage from './pages/admin/ApprovalsPage';
import ApprovalDetail from './pages/admin/ApprovalDetail';
import Slas from './pages/admin/Slas';
import BusinessHours from './pages/admin/BusinessHours';
import Workflows from './pages/admin/Workflows';
import WorkflowDesigner from './pages/admin/WorkflowDesigner';
import FormTemplates from './pages/admin/FormTemplates';
import FormTemplateDesigner from './pages/admin/FormTemplateDesigner';
import LandingEditor from './pages/admin/LandingEditor';
import Positions from './pages/admin/Positions';
import BrandedLogin from './pages/branded/BrandedLogin';
import { BugOutlined, ToolOutlined, SwapOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} />;
  if (roles && !roles.includes(user.role)) return <AccessDenied />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  const defaultOrg = user?.org_slug || 'principal';

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/org/:slug/login" element={<BrandedLogin />} />

      {/* Public pages — accessible to all roles and unauthenticated users */}
      <Route path="/org/:slug" element={<PublicLayout />}>
        <Route index element={<ServiceCatalog />} />
        <Route path="services/:id" element={<ServiceRequest />} />
      </Route>

      {/* User pages — any authenticated user */}
      <Route path="/my-requests" element={<ProtectedRoute><MyRequests /></ProtectedRoute>} />
      <Route path="/my-requests/:id" element={<ProtectedRoute><UserRequestDetail /></ProtectedRoute>} />
      <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />

      {/* Admin pages — only admin/manager, shows ADMIN + CONFIG */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin', 'manager']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="organizations" element={<Organizations />} />
        <Route path="organizations/new" element={<OrganizationDetail />} />
        <Route path="organizations/:id/edit" element={<OrganizationDetail />} />
        <Route path="users" element={<Users />} />
        <Route path="users/new" element={<UserDetail />} />
        <Route path="users/:id/edit" element={<UserDetail />} />
        <Route path="groups" element={<Groups />} />
        <Route path="groups/new" element={<GroupDetail />} />
        <Route path="groups/:id/edit" element={<GroupDetail />} />
        <Route path="categories" element={<Categories />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="services/new" element={<ServiceForm />} />
        <Route path="services/:id/edit" element={<ServiceForm />} />
        <Route path="sla" element={<Slas />} />
        <Route path="business-hours" element={<BusinessHours />} />
        <Route path="workflows" element={<Workflows />} />
        <Route path="workflows/:id/design" element={<WorkflowDesigner />} />
        <Route path="form-templates" element={<FormTemplates />} />
        <Route path="form-templates/:id/design" element={<FormTemplateDesigner />} />
        <Route path="landing" element={<LandingEditor />} />
        <Route path="positions" element={<Positions />} />
      </Route>

      {/* Support pages — admin/manager/resolver, shows only MÓDULOS */}
      <Route path="/support" element={
        <ProtectedRoute roles={['admin', 'manager', 'resolver']}>
          <SupportLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="peticiones" element={<RequestsPage />} />
        <Route path="peticiones/:id" element={<RequestDetail />} />
        <Route path="incidentes" element={<TicketTypePage type="incident" title="Incidentes" icon={<BugOutlined style={{ color: '#ff4d4f' }} />} />} />
        <Route path="ordenes-trabajo" element={<TicketTypePage type="work_order" title="Órdenes de Trabajo" icon={<ToolOutlined style={{ color: '#722ed1' }} />} />} />
        <Route path="solicitudes-cambio" element={<TicketTypePage type="change_request" title="Solicitudes de Cambio" icon={<SwapOutlined style={{ color: '#faad14' }} />} />} />
        <Route path="problemas" element={<TicketTypePage type="problem" title="Problemas" icon={<ExclamationCircleOutlined style={{ color: '#fa541c' }} />} />} />
        <Route path="aprobaciones" element={<ApprovalsPage />} />
        <Route path="aprobaciones/:id" element={<ApprovalDetail />} />
      </Route>

      <Route path="/" element={<Navigate to={`/org/${defaultOrg}`} />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
