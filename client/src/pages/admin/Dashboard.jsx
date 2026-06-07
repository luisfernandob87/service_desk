import { Card, Col, Row, Statistic, Typography } from 'antd';
import { TeamOutlined, ApartmentOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <Typography.Title level={4}>Bienvenido, {user?.full_name}</Typography.Title>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic title="Organizaciones" value={0} prefix={<ApartmentOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Grupos de Soporte" value={0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Usuarios" value={0} prefix={<UserOutlined />} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
