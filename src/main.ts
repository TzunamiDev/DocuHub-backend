import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocsAuthMiddleware } from './middlewares/docs-auth.middleware';

import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    frameguard: false,
    xssFilter: false,
  }));

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global Prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Apply DocsAuthMiddleware directly to Express to bypass the /api global prefix restriction
  const docsAuthMiddleware = app.get(DocsAuthMiddleware);
  app.use('/docs', (req: any, res: any, next: any) => docsAuthMiddleware.use(req, res, next));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
