import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import PublicLayout from './layouts/PublicLayout';
import Login from './pages/Login';
import ServiceCatalog from './pages/public/ServiceCatalog';
import ServiceRequest from './pages/public/ServiceRequest';
import MyRequests from './pages/user/MyRequests';
import UserRequestDetail from './pages/user/RequestDetail';
import TicketDetail from './pages/user/TicketDetail';
import Dashboard from './pages/admin/Dashboard';
import Organizations from './pages/admin/Organizations';
import Users from './pages/admin/Users';
import Groups from './pages/admin/Groups';
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
import { BugOutlined, ToolOutlined, SwapOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (user && user.role !== 'end_user') return <Navigate to="/admin" />;
  if (user) return <Navigate to={`/org/${user.org_slug}`} />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  const defaultOrg = user?.org_slug || 'principal';

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      {/* Public pages */}
      <Route path="/org/:slug" element={<PublicLayout />}>
        <Route index element={<ServiceCatalog />} />
        <Route path="services/:id" element={<ServiceRequest />} />
      </Route>

      {/* User pages */}
      <Route path="/my-requests" element={<ProtectedRoute><MyRequests /></ProtectedRoute>} />
      <Route path="/my-requests/:id" element={<ProtectedRoute><UserRequestDetail /></ProtectedRoute>} />
      <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />

      {/* Admin pages */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin', 'manager', 'resolver']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="organizations" element={<Organizations />} />
        <Route path="users" element={<Users />} />
        <Route path="groups" element={<Groups />} />
        <Route path="categories" element={<Categories />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="services/new" element={<ServiceForm />} />
        <Route path="services/:id/edit" element={<ServiceForm />} />
        <Route path="peticiones" element={<RequestsPage />} />
        <Route path="peticiones/:id" element={<RequestDetail />} />
        <Route path="incidentes" element={<TicketTypePage type="incident" title="Incidentes" icon={<BugOutlined style={{ color: '#ff4d4f' }} />} />} />
        <Route path="ordenes-trabajo" element={<TicketTypePage type="work_order" title="Órdenes de Trabajo" icon={<ToolOutlined style={{ color: '#722ed1' }} />} />} />
        <Route path="solicitudes-cambio" element={<TicketTypePage type="change_request" title="Solicitudes de Cambio" icon={<SwapOutlined style={{ color: '#faad14' }} />} />} />
        <Route path="problemas" element={<TicketTypePage type="problem" title="Problemas" icon={<ExclamationCircleOutlined style={{ color: '#fa541c' }} />} />} />
        <Route path="aprobaciones" element={<ApprovalsPage />} />
        <Route path="aprobaciones/:id" element={<ApprovalDetail />} />
        <Route path="sla" element={<Slas />} />
        <Route path="business-hours" element={<BusinessHours />} />
        <Route path="workflows" element={<Workflows />} />
        <Route path="workflows/:id/design" element={<WorkflowDesigner />} />
        <Route path="form-templates" element={<FormTemplates />} />
        <Route path="form-templates/:id/design" element={<FormTemplateDesigner />} />
        <Route path="landing" element={<LandingEditor />} />
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
