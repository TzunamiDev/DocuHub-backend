import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import configuration from './config/configuration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SettingsModule } from './settings/settings.module';
import { JavadocsModule } from './javadocs/javadocs.module';

import { User } from './users/entities/user.entity';
import { Setting } from './settings/entities/setting.entity';
import { Javadoc } from './javadocs/entities/javadoc.entity';
import { Project } from './projects/entities/project.entity';
import { ProjectsModule } from './projects/projects.module';

import { HealthModule } from './health/health.module';

import { DocsAuthMiddleware } from './middlewares/docs-auth.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('app.database.host'),
        port: configService.get<number>('app.database.port'),
        username: configService.get<string>('app.database.username'),
        password: configService.get<string>('app.database.password'),
        database: configService.get<string>('app.database.name'),
        entities: [User, Setting, Project, Javadoc],
        synchronize: true, // Use carefully in production!
      }),
    }),
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uploadDir = configService.get<string>('app.uploadDir') || 'uploads';
        return [
          {
            rootPath: join(process.cwd(), uploadDir),
            serveRoot: '/docs',
            serveStaticOptions: {
               setHeaders: (res, path, stat) => {
                  res.set('X-Content-Type-Options', 'nosniff');
               }
            }
          },
        ];
      },
    }),
    UsersModule,
    AuthModule,
    SettingsModule,
    JavadocsModule,
    ProjectsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService, DocsAuthMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(DocsAuthMiddleware)
      .forRoutes('/docs/*path');
  }
}

