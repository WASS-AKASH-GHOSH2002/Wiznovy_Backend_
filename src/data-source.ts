import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.WIZNOVY_DB_HOST || 'localhost',
  port: parseInt(process.env.WIZNOVY_DB_PORT) || 3306,
  username: process.env.WIZNOVY_USER_NAME || 'root',
  password: process.env.WIZNOVY_DB_PASS,
  database: process.env.WIZNOVY_DB_NAME,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});