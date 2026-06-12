import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, Patch, Req } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(@Query('search') search?: string, @Req() req?: any) {
    const isAdmin = req?.user?.role === UserRole.ADMIN;
    return this.projectsService.findAll(search, isAdmin);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('popular')
  findPopular(@Req() req?: any) {
    const isAdmin = req?.user?.role === UserRole.ADMIN;
    return this.projectsService.findPopular(3, isAdmin);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('recent')
  findRecent(@Req() req?: any) {
    const isAdmin = req?.user?.role === UserRole.ADMIN;
    return this.projectsService.findRecent(10, isAdmin);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':shortLink')
  findOne(@Param('shortLink') shortLink: string, @Req() req?: any) {
    const isAdmin = req?.user?.role === UserRole.ADMIN;
    return this.projectsService.findByShortLink(shortLink, true, isAdmin);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: any) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
