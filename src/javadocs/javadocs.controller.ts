import { Controller, Get, Post, Body, Param, Delete, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Res, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as os from 'os';
import { JavadocsService } from './javadocs.service';
import { CreateJavadocDto } from './dto/create-javadoc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('javadocs')
export class JavadocsController {
  constructor(private readonly javadocsService: JavadocsService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req?: any) {
    const isAdmin = req?.user?.role === UserRole.ADMIN;
    return this.javadocsService.findOne(id, isAdmin);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: os.tmpdir(),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
      }
    })
  }))
  create(
    @Body() createJavadocDto: CreateJavadocDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('A file must be provided');
    }
    return this.javadocsService.create(createJavadocDto, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/json-docs')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: os.tmpdir(),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
      }
    })
  }))
  uploadJsonDocs(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('A file must be provided');
    }
    return this.javadocsService.uploadJsonDocs(id, file);
  }

  @Get(':id/json-docs/download')
  downloadJsonDocs(@Param('id') id: string, @Res() res: Response, @Req() req: Request) {
    return this.javadocsService.downloadJsonDocs(id, res, req);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.javadocsService.remove(id);
  }
}
