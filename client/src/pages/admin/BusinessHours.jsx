import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message, Tag, Typography, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../api/client';

const defaultSchedule = [
  { day: 1, start: '08:00', end: '17:00' },
  { day: 2, start: '08:00', end: '17:00' },
  { day: 3, start: '08:00', end: '17:00' },
  { day: 4, start: '08:00', end: '17:00' },
  { day: 5, start: '08:00', end: '17:00' },
];

const dayNames = { 0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb' };

export default function BusinessHours() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/business-hours');
      setData(res.data);
    } catch { message.error('Error al cargar') }
    finally { setLoading(false) }
  };

  useEffect(() => { loadData() }, []);

  const handleSave = async (values) => {
    try {
      if (editing) {
        await api.put(`/business-hours/${editing.id}`, values);
        message.success('Horario actualizado');
      } else {
        await api.post('/business-hours', values);
        message.success('Horario creado');
      }
      setModalOpen(false);
      form.resetFields();
      setEditing(null);
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/business-hours/${id}`);
      message.success('Horario eliminado');
      loadData();
    } catch { message.error('Error al eliminar') }
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      name: record.name,
      timezone: record.timezone,
      schedule: record.schedule,
      is_active: record.is_active,
    });
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ schedule: defaultSchedule, timezone: 'America/Mexico_City' });
    setModalOpen(true);
  };

  const columns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Zona Horaria', dataIndex: 'timezone', key: 'timezone' },
    {
      title: 'Horario', key: 'schedule',
      render: (_, r) => {
        const days = (r.schedule || []).map(d =>
          `${dayNames[d.day]}: ${d.start}-${d.end}`
        ).join(', ');
        return days || '24/7';
      },
      ellipsis: true,
    },
    {
      title: 'Activo', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: (v) => v ? <Tag color="green">Sí</Tag> : <Tag color="red">No</Tag>,
    },
    {
      title: 'Acciones', key: 'actions', width: 120,
      render: (_, r) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
          <Popconfirm title="¿Eliminar?" onConfirm={() => handleDelete(r.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>Horarios Laborales</Typography.Title>
      <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ marginBottom: 16 }}>
        Nuevo Horario
      </Button>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editing ? 'Editar Horario' : 'Nuevo Horario'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); }}
        onOk={() => form.submit()}
        width={550}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="timezone" label="Zona Horaria">
            <Input placeholder="America/Mexico_City" />
          </Form.Item>
          <Form.Item label="Horario por Día">
            <Form.List name="schedule">
              {(fields, { add, remove }) => (
                <div>
                  {fields.map(({ key, name, ...rest }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item {...rest} name={[name, 'day']} noStyle>
                        <Select style={{ width: 80 }}
                          options={Object.entries(dayNames).map(([k, v]) => ({ label: v, value: parseInt(k) }))} />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'start']} noStyle>
                        <Input placeholder="08:00" style={{ width: 80 }} />
                      </Form.Item>
                      <span>a</span>
                      <Form.Item {...rest} name={[name, 'end']} noStyle>
                        <Input placeholder="17:00" style={{ width: 80 }} />
                      </Form.Item>
                      {fields.length > 1 && (
                        <Button type="link" danger onClick={() => remove(name)}>Eliminar</Button>
                      )}
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add({ day: 0, start: '09:00', end: '14:00' })}>
                    + Agregar Día
                  </Button>
                </div>
              )}
            </Form.List>
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
