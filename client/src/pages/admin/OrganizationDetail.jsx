import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Typography, Form, Input, Select, Switch, Button, Space, message, Spin, Divider, Table, Tag, Modal, Tooltip, Collapse } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, PlusOutlined, EditOutlined, CloseOutlined, CheckOutlined, TeamOutlined, SettingOutlined } from '@ant-design/icons';
import api from '../../api/client';

/* Sub-component: Department table inside BU row */
function DeptSubTable({ buId, deptRefreshKey, deptColumns, openEditDept, openCreateDept, handleToggleDept }) {
  const [depts, setDepts] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);

  useEffect(() => {
    if (!buId) return;
    setDeptLoading(true);
    api.get(`/departments?business_unit_id=${buId}`)
      .then(res => setDepts(res.data))
      .catch(() => message.error('Error al cargar departamentos'))
      .finally(() => setDeptLoading(false));
  }, [buId, deptRefreshKey]);

  return (
    <Table dataSource={depts} columns={deptColumns} rowKey="id" loading={deptLoading}
      pagination={false} size="small" style={{ marginLeft: 24 }} />
  );
}

export default function OrganizationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [org, setOrg] = useState(null);
  const [bus, setBus] = useState([]);
  const [buLoading, setBuLoading] = useState(false);
  const [deptRefreshKey, setDeptRefreshKey] = useState(0);
  const [buRefreshKey, setBuRefreshKey] = useState(0);
  const [form] = Form.useForm();

  /* BU modal state */
  const [buModalOpen, setBuModalOpen] = useState(false);
  const [buEditing, setBuEditing] = useState(null);
  const [buForm] = Form.useForm();

  /* Dept modal state */
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [deptEditing, setDeptEditing] = useState(null);
  const [deptBuId, setDeptBuId] = useState(null);
  const [deptForm] = Form.useForm();

  /* Expanded BU -> department state */
  const [expandedBuId, setExpandedBuId] = useState(null);

  useEffect(() => {
    if (!isEditing) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/organizations/${id}`);
        setOrg(res.data);
        form.setFieldsValue(res.data);
      } catch { message.error('Error al cargar organización') }
      finally { setLoading(false) }
    })();
  }, [id]);

  const loadBUs = () => {
    if (!id && !isEditing) return;
    setBuLoading(true);
    api.get(`/business-units?organization_id=${isEditing ? id : '__new__'}`)
      .then(res => setBus(res.data))
      .catch(() => message.error('Error al cargar unidades'))
      .finally(() => setBuLoading(false));
  };

  useEffect(() => {
    if (!id) return;
    loadBUs();
  }, [id, buRefreshKey, deptRefreshKey]);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      let saved;
      if (isEditing) {
        saved = (await api.put(`/organizations/${id}`, values)).data;
        message.success('Organización actualizada');
      } else {
        saved = (await api.post('/organizations', values)).data;
        message.success('Organización creada');
        navigate(`/admin/organizations/${saved.id}/edit`, { replace: true });
        return;
      }
      setOrg(saved);
    } catch (err) {
      message.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  /* BU handlers */
  const handleSaveBu = async (values) => {
    try {
      if (buEditing) {
        await api.put(`/business-units/${buEditing.id}`, values);
        message.success('Unidad de negocio actualizada');
      } else {
        await api.post('/business-units', { ...values, organization_id: id });
        message.success('Unidad de negocio creada');
      }
      setBuModalOpen(false);
      buForm.resetFields();
      setBuEditing(null);
      setBuRefreshKey(k => k + 1);
    } catch (err) {
      message.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleToggleBu = async (record) => {
    try {
      await api.put(`/business-units/${record.id}`, { is_active: !record.is_active });
      message.success(record.is_active ? 'Unidad deshabilitada' : 'Unidad habilitada');
      setBuRefreshKey(k => k + 1);
    } catch { message.error('Error al cambiar estado') }
  };

  /* Department handlers */
  const handleSaveDept = async (values) => {
    try {
      if (deptEditing) {
        await api.put(`/departments/${deptEditing.id}`, values);
        message.success('Departamento actualizado');
      } else {
        await api.post('/departments', { ...values, business_unit_id: deptBuId });
        message.success('Departamento creado');
      }
      setDeptModalOpen(false);
      deptForm.resetFields();
      setDeptEditing(null);
      setDeptBuId(null);
      setDeptRefreshKey(k => k + 1);
    } catch (err) {
      message.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleToggleDept = async (record) => {
    try {
      await api.put(`/departments/${record.id}`, { is_active: !record.is_active });
      message.success(record.is_active ? 'Departamento deshabilitado' : 'Departamento habilitado');
      setDeptRefreshKey(k => k + 1);
    } catch { message.error('Error al cambiar estado') }
  };

  /* Department table columns */
  const deptColumns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Descripción', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'Activo', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: (v) => v ? <Tag color="green">Sí</Tag> : <Tag color="red">No</Tag>,
    },
    {
      title: 'Acciones', key: 'actions', width: 150,
      render: (_, r) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => {
            setDeptEditing(r);
            setDeptBuId(r.business_unit_id);
            deptForm.setFieldsValue(r);
            setDeptModalOpen(true);
          }} />
          <Button icon={r.is_active ? <CloseOutlined /> : <CheckOutlined />} size="small" danger={r.is_active}
            onClick={() => handleToggleDept(r)}>
            {r.is_active ? 'Deshabilitar' : 'Habilitar'}
          </Button>
        </Space>
      ),
    },
  ];

  /* Department expansion inside BU row */
  const expandedDeptRender = (buRecord) => (
    <DeptSubTable
      buId={buRecord.id}
      deptRefreshKey={deptRefreshKey}
      deptColumns={deptColumns}
      openEditDept={() => {}}
      openCreateDept={() => {}}
      handleToggleDept={handleToggleDept}
    />
  );

  /* BU table columns */
  const buColumns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Descripción', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'Departamentos', key: 'deptCount', width: 130,
      render: (_, r) => (
        <Button type="link" size="small" icon={<TeamOutlined />}>{r.departments?.length || 0}</Button>
      ),
    },
    {
      title: 'Activo', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: (v) => v ? <Tag color="green">Sí</Tag> : <Tag color="red">No</Tag>,
    },
    {
      title: 'Acciones', key: 'actions', width: 200,
      render: (_, r) => (
        <Space>
          <Tooltip title="Agregar departamento">
            <Button icon={<PlusOutlined />} size="small" onClick={(e) => { e.stopPropagation();
              setDeptEditing(null);
              setDeptBuId(r.id);
              deptForm.resetFields();
              setDeptModalOpen(true);
            }} />
          </Tooltip>
          <Button icon={<EditOutlined />} size="small" onClick={(e) => { e.stopPropagation();
            setBuEditing(r);
            buForm.setFieldsValue(r);
            setBuModalOpen(true);
          }} />
          <Button icon={r.is_active ? <CloseOutlined /> : <CheckOutlined />} size="small" danger={r.is_active}
            onClick={(e) => { e.stopPropagation(); handleToggleBu(r); }}>
            {r.is_active ? 'Deshabilitar' : 'Habilitar'}
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/organizations')}>Volver</Button>
      </Space>

      <Card>
        <Typography.Title level={4}>{isEditing ? org?.name || 'Editar Organización' : 'Nueva Organización'}</Typography.Title>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="logo_url" label="URL del Logo">
            <Input />
          </Form.Item>
          <Form.Item name="is_active" label="Activo" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Collapse ghost items={[{
            key: 'login',
            label: <span><SettingOutlined /> Personalización del Login</span>,
            children: (
              <div style={{ padding: '8px 0' }}>
                <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  Personaliza la apariencia de la página de inicio de sesión para esta organización.
                </Typography.Text>
                <Form.Item name={['login_config', 'logo_url']} label="URL del Logo (login)">
                  <Input placeholder="https://ejemplo.com/logo.png" />
                </Form.Item>
                <Form.Item name={['login_config', 'bg_color']} label="Color de Fondo">
                  <Input type="color" style={{ width: 80, padding: 4 }} />
                </Form.Item>
                <Form.Item name={['login_config', 'bg_image']} label="URL de Imagen de Fondo">
                  <Input placeholder="https://ejemplo.com/fondo.jpg" />
                </Form.Item>
                <Form.Item name={['login_config', 'primary_color']} label="Color Primario (botón)">
                  <Input type="color" style={{ width: 80, padding: 4 }} />
                </Form.Item>
                <Form.Item name={['login_config', 'title']} label="Título de Bienvenida">
                  <Input placeholder="Bienvenido" />
                </Form.Item>
                <Form.Item name={['login_config', 'subtitle']} label="Subtítulo">
                  <Input placeholder="Portal de Servicios" />
                </Form.Item>
                <Form.Item name={['login_config', 'button_text']} label="Texto del Botón">
                  <Input placeholder="Iniciar Sesión" />
                </Form.Item>
                <Form.Item name={['login_config', 'footer_text']} label="Texto del Footer">
                  <Input placeholder="© 2026 ACME Inc." />
                </Form.Item>
              </div>
            ),
          }]} />

          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} size="large">
            {isEditing ? 'Actualizar Organización' : 'Crear Organización'}
          </Button>
        </Form>
      </Card>

      {isEditing && (
        <>
          <Divider />
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Typography.Title level={5} style={{ margin: 0 }}>Unidades de Negocio</Typography.Title>
              <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => {
                setBuEditing(null);
                buForm.resetFields();
                setBuModalOpen(true);
              }}>
                Agregar Unidad
              </Button>
            </div>
            <Table dataSource={bus} columns={buColumns} rowKey="id" loading={buLoading}
              pagination={false} size="small"
              expandable={{
                expandedRowRender: expandedDeptRender,
                rowExpandable: () => true,
              }} />
          </Card>
        </>
      )}

      {/* BU Modal */}
      <Modal title={buEditing ? 'Editar Unidad de Negocio' : 'Nueva Unidad de Negocio'}
        open={buModalOpen}
        onCancel={() => { setBuModalOpen(false); setBuEditing(null); }}
        onOk={() => buForm.submit()}>
        <Form form={buForm} layout="vertical" onFinish={handleSaveBu}>
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Descripción">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Dept Modal */}
      <Modal title={deptEditing ? 'Editar Departamento' : 'Nuevo Departamento'}
        open={deptModalOpen}
        onCancel={() => { setDeptModalOpen(false); setDeptEditing(null); setDeptBuId(null); }}
        onOk={() => deptForm.submit()}>
        <Form form={deptForm} layout="vertical" onFinish={handleSaveDept}>
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Descripción">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
