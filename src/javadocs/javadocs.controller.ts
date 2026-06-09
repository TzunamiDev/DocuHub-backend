import { Controller, Get, Post, Body, Param, Delete, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JavadocsService } from './javadocs.service';
import { CreateJavadocDto } from './dto/create-javadoc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('javadocs')
export class JavadocsController {
  constructor(private readonly javadocsService: JavadocsService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.javadocsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
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
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.javadocsService.remove(id);
  }
}
