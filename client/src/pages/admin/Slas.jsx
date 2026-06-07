import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, InputNumber, Select, Space, message, Tag, Typography, Switch } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import api from '../../api/client';
import { PRIORITIES } from '../../utils/constants';

export default function Slas() {
  const [data, setData] = useState([]);
  const [services, setServices] = useState([]);
  const [businessHours, setBusinessHours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [slaRes, svcRes, bhRes] = await Promise.all([
        api.get('/slas'),
        api.get('/services'),
        api.get('/business-hours'),
      ]);
      setData(slaRes.data);
      setServices(svcRes.data);
      setBusinessHours(bhRes.data);
    } catch { message.error('Error al cargar') }
    finally { setLoading(false) }
  };

  useEffect(() => { loadData() }, []);

  const handleSave = async (values) => {
    try {
      if (editing) {
        await api.put(`/slas/${editing.id}`, values);
        message.success('SLA actualizado');
      } else {
        await api.post('/slas', values);
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
    form.setFieldsValue({
      response_time_hours: record.response_time_hours,
      response_time_minutes: record.response_time_minutes,
      resolution_time_hours: record.resolution_time_hours,
      resolution_time_minutes: record.resolution_time_minutes,
      business_hour_id: record.business_hour_id,
      is_active: record.is_active,
      priority: record.priority,
    });
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const usedCombos = new Set(data.map(s => `${s.service_id}-${s.priority}`));
  const priorityColors = { low: 'default', medium: 'blue', high: 'orange', critical: 'red' };

  const columns = [
    {
      title: 'Servicio', key: 'service',
      render: (_, r) => r.service?.name || '-',
    },
    {
      title: 'Prioridad', dataIndex: 'priority', key: 'priority',
      render: v => <Tag color={priorityColors[v]}>{PRIORITIES[v]}</Tag>,
    },
    {
      title: 'Respuesta', key: 'response',
      render: (_, r) => {
        if (r.response_time_hours && r.response_time_minutes) return `${r.response_time_hours}h ${r.response_time_minutes}m`;
        if (r.response_time_hours) return `${r.response_time_hours}h`;
        return `${r.response_time_minutes || 0}m`;
      },
    },
    {
      title: 'Resolución', key: 'resolution',
      render: (_, r) => {
        if (r.resolution_time_hours && r.resolution_time_minutes) return `${r.resolution_time_hours}h ${r.resolution_time_minutes}m`;
        if (r.resolution_time_hours) return `${r.resolution_time_hours}h`;
        return `${r.resolution_time_minutes || 0}m`;
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

  return (
    <div>
      <Typography.Title level={4}>SLA por Servicio + Prioridad</Typography.Title>
      <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ marginBottom: 16 }}>
        Nuevo SLA
      </Button>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editing ? 'Editar SLA' : 'Nuevo SLA'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); }}
        onOk={() => form.submit()}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          {!editing && (
            <>
              <Form.Item name="service_id" label="Servicio" rules={[{ required: true }]}>
                <Select options={services.map(s => ({ label: s.name, value: s.id, disabled: usedCombos.has(`${s.id}-${form.getFieldValue('priority')}`) }))} />
              </Form.Item>
              <Form.Item name="priority" label="Prioridad" rules={[{ required: true }]}>
                <Select options={Object.entries(PRIORITIES).map(([k, v]) => ({ label: v, value: k }))} />
              </Form.Item>
            </>
          )}
          <Space style={{ width: '100%' }} align="baseline">
            <Form.Item name="response_time_hours" label="Tiempo respuesta">
              <InputNumber min={0} max={999} addonAfter="h" style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="response_time_minutes" label="&nbsp;">
              <InputNumber min={0} max={59} addonAfter="m" style={{ width: 100 }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} align="baseline">
            <Form.Item name="resolution_time_hours" label="Tiempo resolución">
              <InputNumber min={0} max={999} addonAfter="h" style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="resolution_time_minutes" label="&nbsp;">
              <InputNumber min={0} max={59} addonAfter="m" style={{ width: 100 }} />
            </Form.Item>
          </Space>
          <Form.Item name="business_hour_id" label="Horario Laboral">
            <Select allowClear placeholder="24/7 (sin horario)" options={businessHours.map(bh => ({ label: bh.name, value: bh.id }))} />
          </Form.Item>
          {editing && (
            <>
              <Form.Item name="priority" label="Prioridad">
                <Select options={Object.entries(PRIORITIES).map(([k, v]) => ({ label: v, value: k }))} />
              </Form.Item>
              <Form.Item name="is_active" label="Activo" valuePropName="checked">
                <Switch />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
