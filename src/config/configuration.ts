import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'docuhub',
    password: process.env.DB_PASSWORD || 'docuhub_password',
    name: process.env.DB_NAME || 'docuhub_db',
  },
  jwtSecret: process.env.JWT_SECRET || '',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
}));
