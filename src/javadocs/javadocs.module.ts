import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Javadoc } from './entities/javadoc.entity';
import { JavadocsService } from './javadocs.service';
import { JavadocsController } from './javadocs.controller';
import { ProjectsModule } from '../projects/projects.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Javadoc]),
    ConfigModule,
    ProjectsModule,
    AuthModule,
  ],
  controllers: [JavadocsController],
  providers: [JavadocsService],
})
export class JavadocsModule {}
