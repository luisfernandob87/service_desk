import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Typography, Button, Space, Card, Select, Modal, Form, Input,
  ColorPicker, message, Switch, Tooltip, Popconfirm,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined,
  HolderOutlined,
} from '@ant-design/icons';
import api from '../../api/client';

const BLOCK_TYPES = [
  { value: 'hero', label: 'Hero (Título + Subtítulo)' },
  { value: 'service_grid', label: 'Catálogo de Servicios' },
  { value: 'text', label: 'Texto' },
  { value: 'html', label: 'HTML Personalizado' },
  { value: 'separator', label: 'Separador' },
  { value: 'footer', label: 'Footer' },
];

export default function LandingEditor() {
  const [orgs, setOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [org, setOrg] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [form] = Form.useForm();
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const dragNode = useRef(null);

  useEffect(() => {
    api.get('/organizations')
      .then(res => setOrgs(res.data))
      .catch(() => message.error('Error al cargar organizaciones'))
      .finally(() => setLoading(false));
  }, []);

  const loadOrg = useCallback(async (orgId) => {
    setLoading(true);
    try {
      const res = await api.get(`/organizations/${orgId}`);
      setOrg(res.data);
      setBlocks(res.data.landing_config || []);
    } catch { message.error('Error al cargar organización') }
    finally { setLoading(false) }
  }, []);

  useEffect(() => {
    if (selectedOrgId) loadOrg(selectedOrgId);
  }, [selectedOrgId, loadOrg]);

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
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(from, 1);
    newBlocks.splice(index, 0, moved);
    setBlocks(newBlocks);
    setDragIdx(null);
    setOverIdx(null);
    dragNode.current = null;
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
    dragNode.current = null;
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

  const typeLabel = (type) => BLOCK_TYPES.find(t => t.value === type)?.label || type;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>Editor de Landing Page</Typography.Title>
        <Space>
          {org && (
            <Button icon={<EyeOutlined />} onClick={() => window.open(`/org/${org.slug}`, '_blank')}>
              Vista Previa
            </Button>
          )}
          <Button type="primary" onClick={handleSave} loading={saving} disabled={!org}>Guardar</Button>
        </Space>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <strong>Organización:</strong>
          <Select
            style={{ minWidth: 220 }}
            placeholder="Seleccionar organización..."
            showSearch optionFilterProp="label"
            value={selectedOrgId}
            onChange={setSelectedOrgId}
            options={orgs.filter(o => o.is_active !== false).map(o => ({ label: o.name, value: o.id }))}
          />
        </Space>
      </Card>

      {!selectedOrgId ? (
        <Card>
          <Typography.Text type="secondary">Selecciona una organización para empezar a editar su landing page.</Typography.Text>
        </Card>
      ) : (
        <>
          {loading ? (
            <Typography.Text>Cargando...</Typography.Text>
          ) : (
            <>
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
                <div onDragEnd={handleDragEnd}>
                  {blocks.map((block, index) => {
                    const isOver = overIdx === index && dragIdx !== index;
                    return (
                      <div
                        key={block.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        style={{
                          marginBottom: 4,
                          ...(isOver ? {
                            border: '3px dashed #1677ff',
                            borderRadius: 8,
                            padding: 4,
                            boxShadow: '0 0 8px rgba(22,119,255,0.3)',
                          } : {}),
                        }}
                      >
                        <Card
                          size="small"
                          style={{
                            opacity: dragIdx === index ? 0.4 : 1,
                            transition: 'opacity 0.2s',
                          }}
                          actions={[
                            <Tooltip title="Editar">
                              <EditOutlined key="edit" onClick={(e) => { e.stopPropagation(); openEditBlock(block); }} />
                            </Tooltip>,
                            <Popconfirm key="delete" title="¿Eliminar bloque?" onConfirm={() => handleDeleteBlock(block.id)}>
                              <DeleteOutlined style={{ color: '#ff4d4f' }} />
                            </Popconfirm>,
                          ]}
                        >
                          <Space>
                            <HolderOutlined style={{ cursor: 'grab', color: '#999', fontSize: 16 }} />
                            <Typography.Text strong>{typeLabel(block.type)}</Typography.Text>
                            {block.type === 'hero' && <Typography.Text type="secondary">{block.props?.title || '(sin título)'}</Typography.Text>}
                            {block.type === 'text' && <Typography.Text type="secondary" ellipsis style={{ maxWidth: 300 }}>{block.props?.content || '(sin contenido)'}</Typography.Text>}
                            {block.type === 'service_grid' && <Typography.Text type="secondary">Visible: {block.props?.visible !== false ? 'Sí' : 'No'}</Typography.Text>}
                          </Space>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      <Modal
        title={`Editar Bloque - ${typeLabel(editingBlock?.type)}`}
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
