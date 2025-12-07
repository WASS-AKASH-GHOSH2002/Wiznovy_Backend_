const { DataSource } = require('typeorm');
require('dotenv').config();

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.WIZNOVY_DB_HOST || 'localhost',
  port: parseInt(process.env.WIZNOVY_DB_PORT) || 3306,
  username: process.env.WIZNOVY_USER_NAME || 'root',
  password: process.env.WIZNOVY_DB_PASS,
  database: process.env.WIZNOVY_DB_NAME,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,
});

module.exports = dataSource;