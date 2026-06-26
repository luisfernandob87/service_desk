import { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Switch, Card, Space, Typography, message, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { ROLES, ROLE_LABELS } from '../../utils/constants';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [groups, setGroups] = useState([]);
  const [bus, setBus] = useState([]);
  const [depts, setDepts] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orgsRes, groupsRes] = await Promise.all([
        api.get('/organizations'),
        api.get('/support-groups'),
      ]);
      setOrgs(orgsRes.data);
      setGroups(groupsRes.data);

      if (isEditing) {
        const res = await api.get(`/users/${id}`);
        const user = res.data;
        form.setFieldsValue({
          ...user,
          groups: user.groups?.map(g => g.id),
          password: undefined,
        });
        setSelectedOrg(user.organization_id);
        if (user.organization_id) {
          const buRes = await api.get(`/business-units?organization_id=${user.organization_id}`);
          setBus(buRes.data);
          if (user.business_unit_id) {
            const deptRes = await api.get(`/departments?business_unit_id=${user.business_unit_id}`);
            setDepts(deptRes.data);
          }
        }
      }
    } catch { message.error('Error al cargar datos') }
    finally { setLoading(false) }
  };

  useEffect(() => { loadData() }, [id]);

  const handleOrgChange = async (orgId) => {
    setSelectedOrg(orgId);
    form.setFieldsValue({ business_unit_id: undefined, department_id: undefined, position_id: undefined });
    setDepts([]);
    if (orgId) {
      const [buRes, posRes] = await Promise.all([
        api.get(`/business-units?organization_id=${orgId}`),
        api.get(`/positions?organization_id=${orgId}`),
      ]);
      setBus(buRes.data);
      setPositions(posRes.data);
    } else {
      setBus([]);
      setPositions([]);
    }
  };

  const handleBuChange = async (buId) => {
    form.setFieldsValue({ department_id: undefined });
    if (buId) {
      const res = await api.get(`/departments?business_unit_id=${buId}`);
      setDepts(res.data);
    } else {
      setDepts([]);
    }
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      if (isEditing) {
        if (!values.password) delete values.password;
        await api.put(`/users/${id}`, values);
        message.success('Usuario actualizado');
      } else {
        await api.post('/users', values);
        message.success('Usuario creado');
        navigate(`/admin/users`, { replace: true });
      }
    } catch (err) {
      message.error(err.response?.data?.error || 'Error al guardar');
    } finally { setSaving(false) }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  const roleOptions = Object.entries(ROLE_LABELS).map(([k, v]) => ({ label: v, value: k }));

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/users')}>Volver</Button>
      </Space>
      <Card>
        <Typography.Title level={4}>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</Typography.Title>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="organization_id" label="Organización" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" onChange={handleOrgChange}
              options={orgs.filter(o => o.is_active !== false).map(o => ({ label: o.name, value: o.id }))} />
          </Form.Item>
          <Form.Item name="business_unit_id" label="Unidad de Negocio">
            <Select allowClear showSearch optionFilterProp="label" onChange={handleBuChange}
              options={bus.filter(b => b.is_active !== false).map(b => ({ label: b.name, value: b.id }))}
              disabled={!selectedOrg} />
          </Form.Item>
          <Form.Item name="department_id" label="Departamento">
            <Select allowClear showSearch optionFilterProp="label"
              options={depts.filter(d => d.is_active !== false).map(d => ({ label: d.name, value: d.id }))}
              disabled={!form.getFieldValue('business_unit_id')} />
          </Form.Item>
          <Form.Item name="position_id" label="Puesto">
            <Select allowClear showSearch optionFilterProp="label"
              options={positions.filter(p => p.is_active !== false).map(p => ({ label: p.name, value: p.id }))}
              disabled={!selectedOrg} />
          </Form.Item>
          <Form.Item name="full_name" label="Nombre Completo" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label={isEditing ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña'}
            rules={isEditing ? [] : [{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="Rol" rules={[{ required: true }]}>
            <Select options={roleOptions} />
          </Form.Item>
          <Form.Item name="phone" label="Teléfono">
            <Input />
          </Form.Item>
          <Form.Item name="is_active" label="Activo" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.role !== curr.role}>
            {({ getFieldValue }) => {
              const role = getFieldValue('role');
              return (role && role !== 'end_user') ? (
                <Form.Item name="groups" label="Grupos de Soporte">
                  <Select mode="multiple" showSearch optionFilterProp="label"
                    options={groups.map(g => ({ label: g.name, value: g.id }))} />
                </Form.Item>
              ) : null;
            }}
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} size="large">
            {isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
