import { useState, useEffect } from 'react';
import { Card, Button, Space, Tag, Typography, Modal, Form, Input, Select, Switch, Popconfirm, Tooltip, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, VerticalAlignTopOutlined, VerticalAlignBottomOutlined } from '@ant-design/icons';

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'textarea', label: 'Área de Texto' },
  { value: 'select', label: 'Lista Desplegable' },
  { value: 'radio', label: 'Opción Única' },
  { value: 'checkbox', label: 'Casilla de Verificación' },
  { value: 'boolean', label: 'Falso / Verdadero' },
  { value: 'date', label: 'Fecha' },
  { value: 'file', label: 'Archivo Adjunto' },
];

const TYPE_COLORS = {
  text: 'blue',
  textarea: 'cyan',
  select: 'purple',
  radio: 'magenta',
  checkbox: 'geekblue',
  boolean: 'orange',
  date: 'gold',
  file: 'red',
};

const SYSTEM_FIELDS = [
  { name: 'title', label: 'Título', type: 'text', required: true, system: true, placeholder: 'Describe brevemente tu solicitud' },
  { name: 'priority', label: 'Prioridad', type: 'select', required: true, system: true, options: ['Baja', 'Media', 'Alta', 'Crítica'] },
  { name: 'description', label: 'Descripción', type: 'textarea', required: false, system: true, placeholder: 'Describe el detalle de tu solicitud' },
  { name: 'attachments', label: 'Adjuntos', type: 'file', required: false, system: true },
];

function getSystemDefaults() {
  return SYSTEM_FIELDS.map(f => ({ ...f }));
}

export default function FormBuilder({ value = [], onChange }) {
  const [fields, setFields] = useState(() => {
    if (value.length > 0) return value;
    return getSystemDefaults();
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (value.length > 0) setFields(value);
  }, [value]);

  const sync = (newFields) => {
    setFields(newFields);
    onChange(newFields);
  };

  const openAdd = () => {
    setEditingIndex(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (index) => {
    setEditingIndex(index);
    form.setFieldsValue(fields[index]);
    setModalOpen(true);
  };

  const handleSave = () => {
    const values = form.getFieldsValue();
    let newFields;
    if (editingIndex !== null) {
      newFields = fields.map((f, i) => i === editingIndex ? { ...f, ...values } : f);
    } else {
      newFields = [...fields, values];
    }
    sync(newFields);
    setModalOpen(false);
  };

  const handleDelete = (index) => {
    const f = fields[index];
    if (f.system) {
      const toggled = fields.map((field, i) =>
        i === index ? { ...field, hidden: !field.hidden } : field
      );
      sync(toggled);
      return;
    }
    sync(fields.filter((_, i) => i !== index));
  };

  const moveField = (index, dir) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    sync(newFields);
  };

  const resetDefaults = () => {
    sync(getSystemDefaults());
  };

  const renderFieldCard = (field, i) => {
    const isHidden = field.hidden;
    return (
      <Card key={i} size="small" style={{ marginBottom: 6, opacity: isHidden ? 0.5 : 1 }}
        actions={[
          <Tooltip title="Editar"><EditOutlined key="edit" onClick={() => openEdit(i)}
            style={field.system ? { color: '#d9d9d9', cursor: 'not-allowed' } : {}} /></Tooltip>,
          <Tooltip title="Arriba"><VerticalAlignTopOutlined key="up" onClick={() => moveField(i, -1)}
            style={i === 0 ? { color: '#d9d9d9', cursor: 'not-allowed' } : {}} /></Tooltip>,
          <Tooltip title="Abajo"><VerticalAlignBottomOutlined key="down" onClick={() => moveField(i, 1)}
            style={i === fields.length - 1 ? { color: '#d9d9d9', cursor: 'not-allowed' } : {}} /></Tooltip>,
          <Tooltip title={field.system ? (isHidden ? 'Mostrar' : 'Ocultar') : 'Eliminar'}>
            <Popconfirm key="delete"
              title={field.system ? (isHidden ? '¿Mostrar este campo?' : '¿Ocultar este campo?') : '¿Eliminar campo?'}
              onConfirm={() => handleDelete(i)}>
              <DeleteOutlined style={{ color: isHidden ? '#52c41a' : '#ff4d4f' }} />
            </Popconfirm>
          </Tooltip>,
        ]}
      >
        <Space>
          {field.system && <Tag color="default">Sistema</Tag>}
          <Tag color={TYPE_COLORS[field.type]}>{FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}</Tag>
          <strong>{field.label}</strong>
          {field.required && <Tag color="red">Requerido</Tag>}
          {isHidden && <Tag color="default">Oculto</Tag>}
        </Space>
      </Card>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Text strong>Campos del Formulario</Typography.Text>
        <Space>
          <Button size="small" onClick={resetDefaults}>Restablecer</Button>
          <Button type="primary" icon={<PlusOutlined />} size="small" onClick={openAdd}>
            Agregar Campo
          </Button>
        </Space>
      </div>

      {fields.length === 0 ? (
        <Typography.Text type="secondary">Sin campos. Agrega uno o restablece los predeterminados.</Typography.Text>
      ) : (
        fields.map((field, i) => renderFieldCard(field, i))
      )}

      <Modal
        title={editingIndex !== null ? 'Editar Campo' : 'Nuevo Campo'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="label" label="Etiqueta" rules={[{ required: true }]}>
            <Input placeholder="Ej: Nombre del equipo" />
          </Form.Item>
          <Form.Item name="name" label="Identificador" rules={[{ required: true }]}
            tooltip="Nombre interno sin espacios (Ej: equipo_nombre)">
            <Input placeholder="nombre_del_campo" />
          </Form.Item>
          <Form.Item name="type" label="Tipo de Campo" rules={[{ required: true }]}>
            <Select options={FIELD_TYPES} />
          </Form.Item>
          <Form.Item name="required" label="Requerido" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              return (
                <>
                  {['text', 'textarea'].includes(type) && (
                    <Form.Item name="placeholder" label="Placeholder">
                      <Input placeholder="Texto de ayuda dentro del campo" />
                    </Form.Item>
                  )}
                  {['select', 'radio', 'checkbox'].includes(type) && (
                    <Form.Item name="options" label="Opciones" rules={[{ required: true, message: 'Al menos una opción requerida' }]}>
                      <Select mode="tags" placeholder="Escribe opciones y presiona Enter"
                        tokenSeparators={[',']} />
                    </Form.Item>
                  )}
                  {type === 'file' && (
                    <Typography.Text type="secondary">El usuario podrá adjuntar un archivo en este campo.</Typography.Text>
                  )}
                </>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
