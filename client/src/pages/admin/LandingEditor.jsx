import { useState, useEffect, useCallback } from 'react';
import {
  Typography, Button, Space, Card, Select, Modal, Form, Input,
  InputNumber, ColorPicker, message, Switch, Tooltip, Popconfirm,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined,
  VerticalAlignTopOutlined, VerticalAlignBottomOutlined,
} from '@ant-design/icons';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

const BLOCK_TYPES = [
  { value: 'hero', label: 'Hero (Título + Subtítulo)' },
  { value: 'service_grid', label: 'Catálogo de Servicios' },
  { value: 'text', label: 'Texto' },
  { value: 'html', label: 'HTML Personalizado' },
  { value: 'separator', label: 'Separador' },
  { value: 'footer', label: 'Footer' },
];

function SortableBlock({ block, onEdit, onDelete, onMoveUp, onMoveDown, index, total }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeLabel = BLOCK_TYPES.find(t => t.value === block.type)?.label || block.type;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        size="small"
        style={{ marginBottom: 8, cursor: 'grab' }}
        actions={[
          <Tooltip title="Editar"><EditOutlined key="edit" onClick={(e) => { e.stopPropagation(); onEdit(block); }} /></Tooltip>,
          <Tooltip title="Mover arriba">
            <VerticalAlignTopOutlined key="up" onClick={(e) => { e.stopPropagation(); onMoveUp(index); }}
              style={index === 0 ? { color: '#d9d9d9', cursor: 'not-allowed' } : {}} />
          </Tooltip>,
          <Tooltip title="Mover abajo">
            <VerticalAlignBottomOutlined key="down" onClick={(e) => { e.stopPropagation(); onMoveDown(index); }}
              style={index === total - 1 ? { color: '#d9d9d9', cursor: 'not-allowed' } : {}} />
          </Tooltip>,
          <Popconfirm key="delete" title="¿Eliminar bloque?" onConfirm={() => onDelete(block.id)}>
            <DeleteOutlined style={{ color: '#ff4d4f' }} />
          </Popconfirm>,
        ]}
      >
        <Space>
          <Typography.Text strong>{typeLabel}</Typography.Text>
          {block.type === 'hero' && <Typography.Text type="secondary">{block.props?.title || '(sin título)'}</Typography.Text>}
          {block.type === 'text' && <Typography.Text type="secondary" ellipsis style={{ maxWidth: 300 }}>{block.props?.content || '(sin contenido)'}</Typography.Text>}
          {block.type === 'service_grid' && <Typography.Text type="secondary">Visible: {block.props?.visible !== false ? 'Sí' : 'No'}</Typography.Text>}
        </Space>
      </Card>
    </div>
  );
}

export default function LandingEditor() {
  const { user } = useAuth();
  const [org, setOrg] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [form] = Form.useForm();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const loadOrg = useCallback(async () => {
    if (!user?.org_slug) return;
    setLoading(true);
    try {
      const res = await api.get(`/organizations/by-slug/${user.org_slug}`);
      setOrg(res.data);
      setBlocks(res.data.landing_config || []);
    } catch { message.error('Error al cargar organización') }
    finally { setLoading(false) }
  }, [user?.org_slug]);

  useEffect(() => { loadOrg() }, [loadOrg]);

  const handleSave = async () => {
    if (!org) return;
    setSaving(true);
    try {
      await api.patch(`/organizations/${org.id}/landing-config`, { landing_config: blocks });
      message.success('Landing page guardada');
    } catch (err) {
      message.error(err.response?.data?.error || 'Error al guardar');
    }
    finally { setSaving(false) }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      setBlocks(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  const addBlock = (type) => {
    const newBlock = {
      id: `block_${Date.now()}`,
      type,
      props: getDefaultProps(type),
    };
    setBlocks([...blocks, newBlock]);
    setEditingBlock(newBlock);
    form.setFieldsValue(newBlock.props);
    setEditModalOpen(true);
  };

  const getDefaultProps = (type) => {
    switch (type) {
      case 'hero': return { title: '', subtitle: '', bgColor: '#1677ff', textColor: '#ffffff' };
      case 'service_grid': return { title: 'Catálogo de Servicios', showSearch: true, visible: true };
      case 'text': return { content: '' };
      case 'html': return { content: '<p>Personaliza tu landing page</p>' };
      case 'separator': return {};
      case 'footer': return { text: '© 2026 Service Desk. Todos los derechos reservados.' };
      default: return {};
    }
  };

  const openEditBlock = (block) => {
    setEditingBlock(block);
    form.setFieldsValue(block.props);
    setEditModalOpen(true);
  };

  const handleEditSave = () => {
    const values = form.getFieldsValue();
    setBlocks(blocks.map(b => b.id === editingBlock.id ? { ...b, props: values } : b));
    setEditModalOpen(false);
    setEditingBlock(null);
  };

  const handleDeleteBlock = (id) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    setBlocks(arrayMove(blocks, index, newIndex));
  };

  const renderBlockForm = () => {
    if (!editingBlock) return null;
    switch (editingBlock.type) {
      case 'hero':
        return (
          <>
            <Form.Item name="title" label="Título" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="subtitle" label="Subtítulo">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item name="bgColor" label="Color de Fondo">
              <ColorPicker showText />
            </Form.Item>
            <Form.Item name="textColor" label="Color de Texto">
              <ColorPicker showText />
            </Form.Item>
          </>
        );
      case 'service_grid':
        return (
          <>
            <Form.Item name="title" label="Título">
              <Input />
            </Form.Item>
            <Form.Item name="showSearch" label="Mostrar buscador" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="visible" label="Visible" valuePropName="checked">
              <Switch />
            </Form.Item>
          </>
        );
      case 'text':
        return (
          <Form.Item name="content" label="Contenido" rules={[{ required: true }]}>
            <Input.TextArea rows={6} />
          </Form.Item>
        );
      case 'html':
        return (
          <Form.Item name="content" label="HTML" rules={[{ required: true }]}>
            <Input.TextArea rows={6} />
          </Form.Item>
        );
      case 'separator':
        return <Typography.Text type="secondary">El separador no tiene configuración adicional.</Typography.Text>;
      case 'footer':
        return (
          <Form.Item name="text" label="Texto del Footer">
            <Input.TextArea rows={2} />
          </Form.Item>
        );
      default:
        return null;
    }
  };

  if (loading) return <Typography.Text>Cargando...</Typography.Text>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>Editor de Landing Page</Typography.Title>
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => window.open(`/org/${user?.org_slug}`, '_blank')}>
            Vista Previa
          </Button>
          <Button type="primary" onClick={handleSave} loading={saving}>Guardar</Button>
        </Space>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <strong>Agregar bloque:</strong>
          <Select
            style={{ minWidth: 220 }}
            placeholder="Seleccionar tipo..."
            options={BLOCK_TYPES}
            onSelect={addBlock}
            value={undefined}
          />
        </Space>
      </Card>

      {blocks.length === 0 ? (
        <Card>
          <Typography.Text type="secondary">No hay bloques. Agrega uno desde el selector arriba.</Typography.Text>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map((block, index) => (
              <SortableBlock
                key={block.id}
                block={block}
                index={index}
                total={blocks.length}
                onEdit={openEditBlock}
                onDelete={handleDeleteBlock}
                onMoveUp={() => moveBlock(index, -1)}
                onMoveDown={() => moveBlock(index, 1)}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      <Modal
        title={`Editar Bloque - ${BLOCK_TYPES.find(t => t.value === editingBlock?.type)?.label || ''}`}
        open={editModalOpen}
        onCancel={() => { setEditModalOpen(false); setEditingBlock(null); }}
        onOk={handleEditSave}
      >
        <Form form={form} layout="vertical">
          {renderBlockForm()}
        </Form>
      </Modal>
    </div>
  );
}
