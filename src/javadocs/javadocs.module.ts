import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Javadoc } from './entities/javadoc.entity';
import { JavadocsService } from './javadocs.service';
import { JavadocsController } from './javadocs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Javadoc]), ConfigModule],
  controllers: [JavadocsController],
  providers: [JavadocsService],
})
export class JavadocsModule {}
