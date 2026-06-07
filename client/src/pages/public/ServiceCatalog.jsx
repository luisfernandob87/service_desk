import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Typography, Input, Spin, Tag, Divider } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import api from '../../api/client';

const iconMap = {
  laptop: '💻',
  software: '📦',
  network: '🌐',
  printer: '🖨️',
  phone: '📞',
  default: '🔧',
};

function HeroBlock({ props }) {
  return (
    <div style={{
      background: props.bgColor || '#1677ff',
      color: props.textColor || '#fff',
      textAlign: 'center',
      padding: '64px 16px',
      marginBottom: 32,
      borderRadius: 8,
    }}>
      <Typography.Title level={2} style={{ color: props.textColor || '#fff', margin: 0 }}>
        {props.title}
      </Typography.Title>
      {props.subtitle && (
        <Typography.Paragraph style={{ color: props.textColor || '#fff', fontSize: 16, marginTop: 8, opacity: 0.9 }}>
          {props.subtitle}
        </Typography.Paragraph>
      )}
    </div>
  );
}

function ServiceGridBlock({ props, services, slug, search, onSearchChange, filtered }) {
  if (props.visible === false) return null;
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 32px' }}>
      <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
        {props.title || 'Catálogo de Servicios'}
      </Typography.Title>
      {props.showSearch !== false && (
        <Input
          placeholder="Buscar servicios..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          style={{ maxWidth: 500, margin: '0 auto 32px', display: 'block' }}
          size="large"
        />
      )}
      <Row gutter={[24, 24]}>
        {filtered.map(s => (
          <Col xs={24} sm={12} md={8} key={s.id}>
            <Card
              hoverable
              onClick={() => window.location.href = `/org/${slug}/services/${s.id}`}
              style={{ height: '100%' }}
            >
              <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>
                {iconMap[s.icon] || iconMap.default}
              </div>
              <Typography.Title level={5} style={{ textAlign: 'center' }}>
                {s.name}
              </Typography.Title>
              {s.short_description && (
                <Typography.Paragraph style={{ textAlign: 'center', color: '#666', margin: 0 }}>
                  {s.short_description}
                </Typography.Paragraph>
              )}
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                {s.category && <Tag>{s.category.name}</Tag>}
              </div>
            </Card>
          </Col>
        ))}
        {filtered.length === 0 && (
          <Col span={24} style={{ textAlign: 'center', padding: 40 }}>
            <Typography.Text type="secondary">No hay servicios publicados</Typography.Text>
          </Col>
        )}
      </Row>
    </div>
  );
}

function TextBlock({ props }) {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 15 }}>
        {props.content}
      </Typography.Paragraph>
    </div>
  );
}

function HtmlBlock({ props }) {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px' }}
      dangerouslySetInnerHTML={{ __html: props.content }} />
  );
}

function SeparatorBlock() {
  return <Divider style={{ maxWidth: 800, margin: '24px auto' }} />;
}

function FooterBlock({ props }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '24px 16px',
      background: '#f5f5f5',
      marginTop: 32,
    }}>
      <Typography.Text type="secondary">{props.text}</Typography.Text>
    </div>
  );
}

export default function ServiceCatalog() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [org, setOrg] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const orgRes = await api.get(`/organizations/by-slug/${slug}`);
        if (!orgRes.data) return;
        setOrg(orgRes.data);
        const res = await api.get(`/services/published/${orgRes.data.id}`);
        setServices(res.data);
      } catch { /* ignore */ }
      finally { setLoading(false) }
    })();
  }, [slug]);

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.short_description || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!org) return <div style={{ textAlign: 'center', padding: 80 }}><Typography.Text type="danger">Organización no encontrada</Typography.Text></div>;

  const blocks = org.landing_config;

  if (blocks?.length) {
    return (
      <div>
        {blocks.map(block => {
          switch (block.type) {
            case 'hero':
              return <HeroBlock key={block.id} props={block.props} />;
            case 'service_grid':
              return <ServiceGridBlock key={block.id} props={block.props} services={services} slug={slug}
                search={search} onSearchChange={setSearch} filtered={filtered} />;
            case 'text':
              return <TextBlock key={block.id} props={block.props} />;
            case 'html':
              return <HtmlBlock key={block.id} props={block.props} />;
            case 'separator':
              return <SeparatorBlock key={block.id} />;
            case 'footer':
              return <FooterBlock key={block.id} props={block.props} />;
            default:
              return null;
          }
        })}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px' }}>
      <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
        {org.name}
      </Typography.Title>
      <Typography.Paragraph style={{ textAlign: 'center', color: '#666', marginBottom: 32 }}>
        Catálogo de Servicios
      </Typography.Paragraph>

      <Input
        placeholder="Buscar servicios..."
        prefix={<SearchOutlined />}
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ maxWidth: 500, margin: '0 auto 32px', display: 'block' }}
        size="large"
      />

      <Row gutter={[24, 24]}>
        {filtered.map(s => (
          <Col xs={24} sm={12} md={8} key={s.id}>
            <Card
              hoverable
              onClick={() => navigate(`/org/${slug}/services/${s.id}`)}
              style={{ height: '100%' }}
            >
              <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>
                {iconMap[s.icon] || iconMap.default}
              </div>
              <Typography.Title level={5} style={{ textAlign: 'center' }}>
                {s.name}
              </Typography.Title>
              {s.short_description && (
                <Typography.Paragraph style={{ textAlign: 'center', color: '#666', margin: 0 }}>
                  {s.short_description}
                </Typography.Paragraph>
              )}
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                {s.category && <Tag>{s.category.name}</Tag>}
              </div>
            </Card>
          </Col>
        ))}
        {filtered.length === 0 && (
          <Col span={24} style={{ textAlign: 'center', padding: 40 }}>
            <Typography.Text type="secondary">No hay servicios publicados</Typography.Text>
          </Col>
        )}
      </Row>
    </div>
  );
}
