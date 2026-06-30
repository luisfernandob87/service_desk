import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, message, Tag, Typography, Switch, Divider } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { PRIORITIES } from '../../utils/constants';

const PRIORITY_KEYS = ['low', 'medium', 'high', 'critical'];

const defaultEntries = (hasPriorities) => {
  if (hasPriorities) return PRIORITY_KEYS.map(p => ({ priority: p, response_h: 0, response_m: 0, resolution_h: 0, resolution_m: 0 }));
  return [{ priority: 'any', response_h: 0, response_m: 0, resolution_h: 0, resolution_m: 0 }];
};

function formatMinutes(totalMin) {
  if (!totalMin) return '0m';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  let s = '';
  if (h) s += `${h}h `;
  s += `${m}m`;
  return s.trim();
}

export default function Slas() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [businessHours, setBusinessHours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [hasPriorities, setHasPriorities] = useState(true);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const orgId = user?.organization_id;
      const [slaRes, bhRes] = await Promise.all([
        api.get('/slas', { params: { organization_id: orgId } }),
        api.get('/business-hours'),
      ]);
      setData(slaRes.data);
      setBusinessHours(bhRes.data);
    } catch { message.error('Error al cargar') }
    finally { setLoading(false) }
  };

  useEffect(() => { loadData() }, []);

  const handleSave = async (values) => {
    try {
      const payload = {
        organization_id: user.organization_id,
        name: values.name,
        description: values.description,
        has_priorities: hasPriorities,
        business_hour_id: values.business_hour_id || null,
        entries: hasPriorities
          ? PRIORITY_KEYS.map(p => ({
              priority: p,
              response_h: values[`response_h_${p}`] || 0,
              response_m: values[`response_m_${p}`] || 0,
              resolution_h: values[`resolution_h_${p}`] || 0,
              resolution_m: values[`resolution_m_${p}`] || 0,
            }))
          : [{
              priority: 'any',
              response_h: values.response_h_any || 0,
              response_m: values.response_m_any || 0,
              resolution_h: values.resolution_h_any || 0,
              resolution_m: values.resolution_m_any || 0,
            }],
      };

      if (editing) {
        await api.put(`/slas/${editing.id}`, { ...payload, is_active: values.is_active });
        message.success('SLA actualizado');
      } else {
        await api.post('/slas', payload);
        message.success('SLA creado');
      }
      setModalOpen(false);
      form.resetFields();
      setEditing(null);
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  const openEdit = (record) => {
    setEditing(record);
    setHasPriorities(record.has_priorities !== false);
    const values = {
      name: record.name,
      description: record.description,
      business_hour_id: record.business_hour_id,
      is_active: record.is_active,
    };
    for (const entry of (record.entries || [])) {
      values[`response_h_${entry.priority}`] = entry.response_h;
      values[`response_m_${entry.priority}`] = entry.response_m;
      values[`resolution_h_${entry.priority}`] = entry.resolution_h;
      values[`resolution_m_${entry.priority}`] = entry.resolution_m;
    }
    form.setFieldsValue(values);
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setHasPriorities(true);
    form.resetFields();
    setModalOpen(true);
  };

  const columns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Descripción', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'Prioridades', key: 'priorities',
      render: (_, r) => {
        const entries = r.entries || [];
        if (r.has_priorities === false) return <Tag>Sin prioridad</Tag>;
        return entries.map(e => (
          <Tag key={e.priority} color={e.priority === 'critical' ? 'red' : e.priority === 'high' ? 'orange' : e.priority === 'medium' ? 'blue' : 'default'}>
            {PRIORITIES[e.priority] || e.priority}: {formatMinutes(e.resolution_h * 60 + e.resolution_m)}
          </Tag>
        ));
      },
    },
    {
      title: 'Horario', key: 'businessHour',
      render: (_, r) => r.businessHour?.name || '24/7',
    },
    {
      title: 'Activo', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: (v) => v ? <Tag color="green">Sí</Tag> : <Tag color="red">No</Tag>,
    },
    {
      title: 'Acciones', key: 'actions', width: 80,
      render: (_, r) => (
        <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
      ),
    },
  ];

  const renderEntryRow = (priority, label) => (
    <div key={priority} style={{ background: '#fafafa', padding: '8px 12px', borderRadius: 6, marginBottom: 8 }}>
      <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>{label}</Typography.Text>
      <Space style={{ width: '100%' }} align="baseline">
        <Form.Item name={`response_h_${priority}`} label="Respuesta" style={{ marginBottom: 4 }}>
          <InputNumber min={0} max={999} addonAfter="h" style={{ width: 100 }} />
        </Form.Item>
        <Form.Item name={`response_m_${priority}`} label="&nbsp;" style={{ marginBottom: 4 }}>
          <InputNumber min={0} max={59} addonAfter="m" style={{ width: 100 }} />
        </Form.Item>
        <Form.Item name={`resolution_h_${priority}`} label="Resolución" style={{ marginBottom: 4 }}>
          <InputNumber min={0} max={999} addonAfter="h" style={{ width: 100 }} />
        </Form.Item>
        <Form.Item name={`resolution_m_${priority}`} label="&nbsp;" style={{ marginBottom: 4 }}>
          <InputNumber min={0} max={59} addonAfter="m" style={{ width: 100 }} />
        </Form.Item>
      </Space>
    </div>
  );

  return (
    <div>
      <Typography.Title level={4}>SLA</Typography.Title>
      <Typography.Paragraph type="secondary">
        Los SLA definen los tiempos de respuesta y resolución. Se asocian a tipos de ticket dentro de un flujo de trabajo.
      </Typography.Paragraph>
      <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ marginBottom: 16 }}>
        Nuevo SLA
      </Button>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editing ? 'Editar SLA' : 'Nuevo SLA'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Descripción">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Divider />
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontWeight: 500, marginRight: 12 }}>Aplica prioridad</span>
            <Switch
              checked={hasPriorities}
              onChange={(v) => {
                setHasPriorities(v);
                if (!v) {
                  PRIORITY_KEYS.forEach(p => {
                    form.setFieldsValue({
                      [`response_h_${p}`]: undefined,
                      [`response_m_${p}`]: undefined,
                      [`resolution_h_${p}`]: undefined,
                      [`resolution_m_${p}`]: undefined,
                    });
                  });
                }
              }}
              checkedChildren="Sí"
              unCheckedChildren="No"
            />
          </div>

          {hasPriorities ? (
            <>
              {renderEntryRow('low', PRIORITIES.low)}
              {renderEntryRow('medium', PRIORITIES.medium)}
              {renderEntryRow('high', PRIORITIES.high)}
              {renderEntryRow('critical', PRIORITIES.critical)}
            </>
          ) : (
            renderEntryRow('any', 'Tiempo único (sin prioridad)')
          )}

          <Divider />
          <Form.Item name="business_hour_id" label="Horario Laboral">
            <Select allowClear placeholder="24/7 (sin horario)" options={businessHours.map(bh => ({ label: bh.name, value: bh.id }))} />
          </Form.Item>

          {editing && (
            <Form.Item name="is_active" label="Activo" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}