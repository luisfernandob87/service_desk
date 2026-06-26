import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Typography, Form, Input, Select, Button, Space, message, Spin, Divider, Table, Tag, Switch } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, PlusOutlined, CloseOutlined, CheckOutlined, UserOutlined } from '@ant-design/icons';
import api from '../../api/client';
import { ROLE_LABELS } from '../../utils/constants';

const SUPPORT_ROLES = ['admin', 'manager', 'resolver'];

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    (async () => {
      try {
        const [orgsRes, usersRes] = await Promise.all([
          api.get('/organizations'),
          api.get('/users'),
        ]);
        setOrgs(orgsRes.data);
        const supportUsers = usersRes.data.filter(u => SUPPORT_ROLES.includes(u.role) && u.is_active);
        setCandidates(supportUsers);

        if (isEditing) {
          const groupRes = await api.get(`/support-groups/${id}`);
          const group = groupRes.data;
          form.setFieldsValue({
            name: group.name,
            description: group.description,
            is_active: group.is_active,
            organization_ids: group.organizations?.map(o => o.id) || [],
          });
          const memberIds = group.members?.map(m => m.id) || [];
          setMembers(group.members || []);
          setSelectedIds(memberIds);
        }
      } catch { message.error('Error al cargar datos') }
      finally { setLoading(false) }
    })();
  }, [id]);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const payload = { ...values, members: selectedIds };
      if (isEditing) {
        await api.put(`/support-groups/${id}`, payload);
        message.success('Grupo actualizado');
      } else {
        const res = await api.post('/support-groups', payload);
        message.success('Grupo creado');
        navigate(`/admin/groups/${res.data.id}/edit`, { replace: true });
        return;
      }
    } catch (err) {
      message.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const activeOrgs = orgs.filter(o => o.is_active);
  const allOrgIds = activeOrgs.map(o => o.id);
  const orgOptions = activeOrgs.map(o => ({ label: `${o.name} (${o.slug})`, value: o.id }));

  const handleSelectAllOrgs = () => {
    const current = form.getFieldValue('organization_ids') || [];
    const allSelected = allOrgIds.every(id => current.includes(id));
    form.setFieldsValue({ organization_ids: allSelected ? [] : [...allOrgIds] });
  };

  const addMember = (userId) => {
    const user = candidates.find(c => c.id === userId);
    if (!user || selectedIds.includes(userId)) return;
    setMembers(prev => [...prev, user]);
    setSelectedIds(prev => [...prev, userId]);
  };

  const removeMember = (userId) => {
    setMembers(prev => prev.filter(m => m.id !== userId));
    setSelectedIds(prev => prev.filter(id => id !== userId));
  };

  const memberColumns = [
    { title: 'Nombre', dataIndex: 'full_name', key: 'full_name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Rol', dataIndex: 'role', key: 'role',
      render: (v) => <Tag>{ROLE_LABELS[v] || v}</Tag>,
    },
    {
      title: 'Acciones', key: 'actions', width: 100,
      render: (_, r) => (
        <Button icon={<CloseOutlined />} size="small" danger onClick={() => removeMember(r.id)}>
          Quitar
        </Button>
      ),
    },
  ];

  const availableUsers = candidates.filter(c => !selectedIds.includes(c.id));

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/groups')}>Volver</Button>
      </Space>

      <Card>
        <Typography.Title level={4}>{isEditing ? 'Editar Grupo' : 'Nuevo Grupo'}</Typography.Title>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Descripción">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="is_active" label="Activo" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="organization_ids" label="Organizaciones" rules={[{ required: true, message: 'Selecciona al menos una' }]}>
            <Select mode="multiple" showSearch optionFilterProp="label"
              dropdownRender={(menu) => (
                <div>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                    onClick={handleSelectAllOrgs}>
                    <a>{allOrgIds.every(id => (form.getFieldValue('organization_ids') || []).includes(id))
                      ? 'Deseleccionar todas' : 'Seleccionar todas'}</a>
                  </div>
                  {menu}
                </div>
              )}
              options={orgOptions} />
          </Form.Item>

          {isEditing && (
            <>
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Typography.Text strong><UserOutlined /> Miembros ({members.length})</Typography.Text>
                <Select
                  showSearch optionFilterProp="label" placeholder="Buscar y agregar miembro..."
                  value={undefined} onChange={addMember} style={{ width: 280 }}
                  options={availableUsers.map(u => ({ label: `${u.full_name} (${u.email})`, value: u.id }))}
                  notFoundContent="No hay usuarios disponibles"
                />
              </div>
              <Table dataSource={members} columns={memberColumns} rowKey="id"
                pagination={false} size="small" locale={{ emptyText: 'Sin miembros' }} />
              <Divider />
            </>
          )}

          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} size="large">
            {isEditing ? 'Actualizar Grupo' : 'Crear Grupo'}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
