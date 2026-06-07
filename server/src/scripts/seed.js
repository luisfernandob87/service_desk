require('dotenv').config();
const { sequelize, Organization, User } = require('../models');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    const org = await Organization.create({
      name: 'Organización Principal',
      slug: 'principal',
    });

    const admin = await User.create({
      organization_id: org.id,
      full_name: 'Administrador',
      email: 'admin@servicedesk.local',
      password_hash: 'admin123',
      role: 'admin',
      phone: '555-0000',
    });

    const manager = await User.create({
      organization_id: org.id,
      full_name: 'Gestor General',
      email: 'manager@servicedesk.local',
      password_hash: 'manager123',
      role: 'manager',
      phone: '555-0001',
    });

    console.log('Seed completed.');
    console.log(`  Admin: admin@servicedesk.local / admin123`);
    console.log(`  Manager: manager@servicedesk.local / manager123`);
  } catch (error) {
    console.error('Seed error:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

seed();
