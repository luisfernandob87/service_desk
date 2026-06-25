import { useState, useEffect, useRef } from 'react';
import { Card, Button, Space, Tag, Typography, Modal, Form, Input, Select, Switch, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HolderOutlined } from '@ant-design/icons';

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'textarea', label: 'Área de Texto' },
  { value: 'select', label: 'Lista Desplegable' },
  { value: 'radio', label: 'Opción Única' },
  { value: 'checkbox', label: 'Casilla de Verificación' },
  { value: 'boolean', label: 'Falso / Verdadero' },
  { value: 'date', label: 'Fecha' },
  { value: 'time', label: 'Hora' },
  { value: 'datetime', label: 'Fecha y Hora' },
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
  time: 'lime',
  datetime: 'green',
  file: 'red',
};

export default function FormBuilder({ value = [], onChange }) {
  const [fields, setFields] = useState(() => [...value]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const [form] = Form.useForm();
  const dragNode = useRef(null);

  useEffect(() => {
    setFields([...value]);
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
    sync(fields.filter((_, i) => i !== index));
  };

  const handleDragStart = (e, index) => {
    dragNode.current = index;
    setDragIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragNode.current === index) return;
    setOverIdx(index);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    const from = dragNode.current;
    if (from === index) return;
    const newFields = [...fields];
    const [moved] = newFields.splice(from, 1);
    newFields.splice(index, 0, moved);
    sync(newFields);
    setDragIdx(null);
    setOverIdx(null);
    dragNode.current = null;
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
    dragNode.current = null;
  };

  return (
    <div>
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Text strong>Campos del Formulario</Typography.Text>
        <Button type="primary" icon={<PlusOutlined />} size="small" onClick={openAdd}>
          Agregar Campo
        </Button>
      </div>

      {fields.length === 0 ? (
        <Typography.Text type="secondary">Sin campos. Presiona "Agregar Campo" para comenzar.</Typography.Text>
      ) : (
        <div>
          {fields.map((field, i) => {
            const isDragging = dragIdx === i;
            const isOver = overIdx === i && dragIdx !== i;
            return (
              <div
                key={i}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={(e) => handleDrop(e, i)}
                onDragEnd={handleDragEnd}
                style={{
                  marginBottom: 6,
                  opacity: isDragging ? 0.3 : 1,
                  ...(isOver && overIdx > dragIdx ? {
                    borderTop: '3px dashed #1677ff',
                    paddingTop: 8,
                    boxShadow: '0 -4px 12px rgba(22,119,255,0.15)',
                  } : {}),
                  ...(isOver && overIdx < dragIdx ? {
                    borderBottom: '3px dashed #1677ff',
                    paddingBottom: 8,
                    boxShadow: '0 4px 12px rgba(22,119,255,0.15)',
                  } : {}),
                  cursor: 'grab',
                  transition: 'box-shadow 0.15s, border-color 0.15s',
                }}
              >
                <Card size="small"
                  actions={[
                    <EditOutlined key="edit" onClick={(e) => { e.stopPropagation(); openEdit(i); }} />,
                    <Popconfirm key="delete" title="¿Eliminar campo?" onConfirm={() => handleDelete(i)}>
                      <DeleteOutlined style={{ color: '#ff4d4f' }} />
                    </Popconfirm>,
                  ]}
                >
                  <Space>
                    <HolderOutlined style={{ color: '#999', cursor: 'grab' }} />
                    <Tag color={TYPE_COLORS[field.type]}>{FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}</Tag>
                    <strong>{field.label}</strong>
                    {field.required && <Tag color="red">Requerido</Tag>}
                  </Space>
                </Card>
              </div>
            );
          })}
        </div>
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
