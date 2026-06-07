const { Sequelize } = require('sequelize');
require('dotenv').config();

async function main() {
  const s = new Sequelize({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    dialect: 'postgres',
    logging: false,
  });

  try {
    const [rows] = await s.query("SELECT 1 FROM pg_database WHERE datname = 'service_desk'");
    if (rows.length === 0) {
      await s.query('CREATE DATABASE service_desk');
      console.log('Database service_desk created');
    } else {
      console.log('Database service_desk already exists');
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await s.close();
    process.exit(0);
  }
}

main();
