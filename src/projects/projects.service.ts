import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async findAll(search?: string): Promise<Project[]> {
    if (search) {
      const qb = this.projectsRepository.createQueryBuilder('project')
        .leftJoinAndSelect('project.versions', 'version')
        .where('project.name ILIKE :search', { search: `%${search}%` })
        .orWhere('project.description ILIKE :search', { search: `%${search}%` })
        .orWhere('project.author ILIKE :search', { search: `%${search}%` })
        .orWhere('project.shortLink ILIKE :search', { search: `%${search}%` })
        .orWhere('project.tags ILIKE :search', { search: `%${search}%` })
        .orWhere('version.version ILIKE :search', { search: `%${search}%` });
      
      return qb.getMany();
    }
    return this.projectsRepository.find({ relations: { versions: true } });
  }

  async findPopular(limit: number): Promise<Project[]> {
    return this.projectsRepository.find({
      order: { views: 'DESC' },
      take: limit,
      relations: { versions: true },
    });
  }

  async findRecent(limit: number): Promise<Project[]> {
    return this.projectsRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: { versions: true },
    });
  }

  async findByShortLink(shortLink: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { shortLink },
      relations: { versions: true },
    });
    if (!project) {
      throw new NotFoundException(`Project with shortLink '${shortLink}' not found`);
    }
    return project;
  }

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const existing = await this.projectsRepository.findOne({ where: { shortLink: createProjectDto.shortLink } });
    if (existing) {
      throw new ConflictException(`Project with shortLink '${createProjectDto.shortLink}' already exists`);
    }

    const project = this.projectsRepository.create({
      ...createProjectDto,
      tags: typeof createProjectDto.tags === 'string' ? createProjectDto.tags.split(',').map(t => t.trim()) : createProjectDto.tags,
    });
    return this.projectsRepository.save(project);
  }

  async update(id: string, updateProjectDto: any): Promise<Project> {
    const project = await this.projectsRepository.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project not found`);
    }

    if (updateProjectDto.tags && typeof updateProjectDto.tags === 'string') {
      updateProjectDto.tags = updateProjectDto.tags.split(',').map(t => t.trim());
    }

    Object.assign(project, updateProjectDto);
    return this.projectsRepository.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.projectsRepository.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project not found`);
    }
    // Deleting project will cascade delete versions in DB if configured, but let's just use TypeORM remove
    await this.projectsRepository.remove(project);
  }
}
