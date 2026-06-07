import { useState, useEffect } from 'react';
import { Badge, Popover, List, Button, Typography, Space, Empty, Tooltip } from 'antd';
import { BellOutlined, CheckOutlined, ClearOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const loadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setCount(res.data.count);
    } catch {}
  };

  const loadList = async () => {
    try {
      const res = await api.get('/notifications?limit=50');
      setNotifications(res.data);
    } catch {}
  };

  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = (visible) => {
    setOpen(visible);
    if (visible) loadList();
  };

  const handleMarkRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    loadCount();
    loadList();
  };

  const handleMarkAllRead = async () => {
    await api.put('/notifications/read-all');
    setCount(0);
    setNotifications(notifications.map(n => ({ ...n, read_at: new Date().toISOString() })));
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
      loadCount();
    } catch {}
  };

  const handleClearRead = async () => {
    const readIds = notifications.filter(n => n.read_at).map(n => n.id);
    if (readIds.length === 0) return;
    try {
      await api.post('/notifications/clear-read', { ids: readIds });
      setNotifications(notifications.filter(n => !n.read_at));
    } catch {}
  };

  const handleClick = (notif) => {
    if (notif.link) navigate(notif.link);
    if (!notif.read_at) handleMarkRead(notif.id);
    setOpen(false);
  };

  const content = (
    <div style={{ width: 380 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Typography.Text strong>Notificaciones</Typography.Text>
        <Space size="small">
          {notifications.some(n => n.read_at) && (
            <Button type="link" size="small" onClick={handleClearRead} icon={<ClearOutlined />}>
              Limpiar leídas
            </Button>
          )}
          {count > 0 && (
            <Button type="link" size="small" onClick={handleMarkAllRead} icon={<CheckOutlined />}>
              Leer todas
            </Button>
          )}
        </Space>
      </div>
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        <List
          dataSource={notifications}
          locale={{ emptyText: <Empty description="Sin notificaciones" /> }}
          renderItem={(item) => (
            <List.Item
              onClick={() => handleClick(item)}
              style={{
                cursor: 'pointer',
                background: item.read_at ? 'transparent' : '#e6f4ff',
                padding: '8px 12px',
                borderRadius: 4,
                marginBottom: 4,
              }}
              actions={[
                <Tooltip key="delete" title="Eliminar">
                  <CloseOutlined style={{ color: '#999', fontSize: 11 }} onClick={(e) => handleDelete(item.id, e)} />
                </Tooltip>,
              ]}
            >
              <List.Item.Meta
                title={<Typography.Text strong={!item.read_at} style={{ fontSize: 13 }}>{item.title}</Typography.Text>}
                description={
                  <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }}
                    ellipsis={{ rows: 2 }}>
                    {item.message}
                  </Typography.Paragraph>
                }
              />
            </List.Item>
          )}
        />
      </div>
    </div>
  );

  return (
    <Popover content={content} trigger="click" open={open} onOpenChange={handleOpen} placement="bottomRight">
      <Badge count={count} size="small" style={{ cursor: 'pointer' }}>
        <BellOutlined style={{ fontSize: 18, color: '#fff' }} />
      </Badge>
    </Popover>
  );
}
