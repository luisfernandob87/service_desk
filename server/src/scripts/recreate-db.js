require('dotenv').config();
const { Sequelize } = require('sequelize');

async function main() {
  const s = new Sequelize({
    host: 'localhost', port: 5432,
    database: 'postgres',
    username: 'postgres', password: 'postgres',
    dialect: 'postgres', logging: false,
  });

  await s.query("SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = 'service_desk' AND pid <> pg_backend_pid()");
  await s.query('DROP DATABASE IF EXISTS service_desk');
  await s.query('CREATE DATABASE service_desk');
  console.log('DB recreated');
  await s.close();
  process.exit(0);
}

main();
