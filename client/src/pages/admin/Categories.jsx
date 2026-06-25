import { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, Select, TreeSelect, Space, Popconfirm, message, Tag, Typography, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FolderOutlined, FileOutlined } from '@ant-design/icons';
import api from '../../api/client';

function getDepthFromFlat(flat, id) {
  let depth = 0;
  let current = flat.find(c => c.id === id);
  while (current?.parent_id) {
    depth++;
    current = flat.find(c => c.id === current.parent_id);
  }
  return depth;
}

function buildTree(flat) {
  const map = {};
  const roots = [];
  flat.forEach(item => { map[item.id] = { ...item, key: item.id }; });
  flat.forEach(item => {
    if (item.parent_id && map[item.parent_id]) {
      if (!map[item.parent_id].children) map[item.parent_id].children = [];
      map[item.parent_id].children.push(map[item.id]);
    } else if (!item.parent_id) {
      roots.push(map[item.id]);
    }
  });
  return roots;
}

function flattenForSelect(items, excludeIds, maxDepth = 2, depth = 0) {
  const result = [];
  for (const item of items) {
    if (!excludeIds.has(item.id)) {
      const entry = { value: item.id, title: item.name };
      if (item.children?.length && depth < maxDepth - 1) {
        entry.children = flattenForSelect(item.children, excludeIds, maxDepth, depth + 1);
      }
      result.push(entry);
    }
  }
  return result;
}

function findDescendantIds(items) {
  const ids = new Set();
  function walk(list) {
    for (const item of list) {
      ids.add(item.id);
      if (item.children) walk(item.children);
    }
  }
  walk(items);
  return ids;
}

const TYPE_LABELS = { service: 'Servicio', solution: 'Solución', both: 'Ambos' };
const TYPE_COLORS = { service: 'blue', solution: 'green', both: 'purple' };

export default function Categories() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [parentPreset, setParentPreset] = useState(null);
  const [filterType, setFilterType] = useState(null);
  const [categoryType, setCategoryType] = useState('service');
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const catRes = await api.get('/categories');
      setData(catRes.data);
    } catch { message.error('Error al cargar') }
    finally { setLoading(false) }
  };

  useEffect(() => { loadData() }, []);

  const treeData = useMemo(() => buildTree(data), [data]);

  const visibleIds = useMemo(() => {
    if (!filterType) return null;
    const matching = new Set(data.filter(c => c.type === filterType || c.type === 'both').map(c => c.id));
    data.forEach(c => {
      if (matching.has(c.id)) {
        let pid = c.parent_id;
        while (pid) { matching.add(pid); pid = data.find(x => x.id === pid)?.parent_id; }
      }
    });
    return matching;
  }, [data, filterType]);

  const filterNode = (items) => items?.filter(n => visibleIds.has(n.id)).map(n => ({ ...n, children: filterNode(n.children) }));
  const treeSource = visibleIds ? filterNode(treeData) : treeData;

  const handleSave = async (values) => {
    try {
      values.type = categoryType;
      if (values.parent_id === undefined) values.parent_id = null;
      if (editing) {
        await api.put(`/categories/${editing.id}`, values);
        message.success('Categoría actualizada');
      } else {
        await api.post('/categories', values);
        message.success('Categoría creada');
      }
      setModalOpen(false);
      setParentPreset(null);
      form.resetFields();
      setEditing(null);
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      message.success('Categoría eliminada');
      loadData();
    } catch { message.error('Error al eliminar') }
  };

  const openEdit = (record) => {
    setEditing(record);
    setParentPreset(null);
    setCategoryType(record.type || 'service');
    form.setFieldsValue({ name: record.name, parent_id: record.parent_id || undefined });
    setModalOpen(true);
  };

  const openCreate = (parentId) => {
    setEditing(null);
    setParentPreset(parentId || null);
    form.resetFields();
    setCategoryType('service');
    form.setFieldsValue({ parent_id: parentId || undefined });
    setModalOpen(true);
  };

  const excludeIds = useMemo(() => {
    if (!editing) return new Set();
    const tree = buildTree(data.filter(c => c.id === editing.id));
    return findDescendantIds(tree);
  }, [editing, data]);

  const selectTreeData = useMemo(() => {
    return flattenForSelect(treeData, excludeIds);
  }, [treeData, excludeIds]);

  const columns = [
    {
      title: 'Nombre', dataIndex: 'name', key: 'name',
      render: (text, r) => (
        <Space>
          {r.children?.length ? <FolderOutlined style={{ color: '#1890ff' }} /> : <FileOutlined style={{ color: '#8c8c8c' }} />}
          <span>{text}</span>
          {!r.is_active && <Tag color="default" style={{ fontSize: 10 }}>Inactiva</Tag>}
        </Space>
      ),
    },
    {
      title: 'Tipo', dataIndex: 'type', key: 'type', width: 110,
      render: (v) => <Tag color={TYPE_COLORS[v] || 'default'}>{TYPE_LABELS[v] || v}</Tag>,
    },
    {
      title: 'Activo', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: (v) => v ? <Tag color="green">Sí</Tag> : <Tag color="red">No</Tag>,
    },
    {
      title: 'Acciones', key: 'actions', width: 200,
      render: (_, r) => (
        <Space>
          {getDepthFromFlat(data, r.id) < 2 && <Button icon={<PlusOutlined />} size="small" onClick={() => openCreate(r.id)} title="Agregar subcategoría" />}
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
      <Typography.Title level={4}>Categorías</Typography.Title>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()} style={{ marginBottom: 16 }}>
        Nueva Categoría
      </Button>
      <Space style={{ marginBottom: 16 }}>
        <Select value={filterType} onChange={setFilterType} style={{ width: 160 }} allowClear placeholder="Todos los tipos"
          options={Object.entries(TYPE_LABELS).map(([k, v]) => ({ label: v, value: k }))} />
      </Space>
      <Table
        dataSource={treeSource}
        columns={columns}
        rowKey="id"
        loading={loading}
        defaultExpandAllRows
      />

      <Modal
        title={editing ? 'Editar Categoría' : 'Nueva Categoría'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); setParentPreset(null); }}
        onOk={() => form.submit()}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Tipo" required>
            <Space>
              <Checkbox
                checked={['service', 'both'].includes(categoryType)}
                onChange={(e) => {
                  const isSvc = e.target.checked;
                  const isSol = ['solution', 'both'].includes(categoryType);
                  setCategoryType(isSvc && isSol ? 'both' : isSvc ? 'service' : isSol ? 'solution' : 'service');
                }}
              >
                Servicio
              </Checkbox>
              <Checkbox
                checked={['solution', 'both'].includes(categoryType)}
                onChange={(e) => {
                  const isSol = e.target.checked;
                  const isSvc = ['service', 'both'].includes(categoryType);
                  setCategoryType(isSvc && isSol ? 'both' : isSvc ? 'service' : isSol ? 'solution' : 'service');
                }}
              >
                Solución
              </Checkbox>
            </Space>
          </Form.Item>
          <Form.Item name="parent_id" label="Categoría Padre">
            <TreeSelect
              treeData={selectTreeData}
              placeholder="Seleccionar categoría padre"
              allowClear
              treeDefaultExpandAll
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
