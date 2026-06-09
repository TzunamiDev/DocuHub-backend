import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Javadoc } from './entities/javadoc.entity';
import { CreateJavadocDto } from './dto/create-javadoc.dto';
import { ZipHandler } from './utils/zip-handler';
import { ConfigService } from '@nestjs/config';
import { ProjectsService } from '../projects/projects.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class JavadocsService {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(Javadoc)
    private javadocRepository: Repository<Javadoc>,
    private configService: ConfigService,
    private projectsService: ProjectsService,
  ) {
    this.uploadDir = path.resolve(this.configService.get<string>('app.uploadDir') || 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async findOne(id: string): Promise<Javadoc> {
    const javadoc = await this.javadocRepository.findOne({ where: { id }, relations: { project: true } });
    if (!javadoc) {
      throw new NotFoundException(`Javadoc with ID ${id} not found`);
    }
    
    // Increment views on version and project
    javadoc.views += 1;
    await this.javadocRepository.save(javadoc);
    
    return javadoc;
  }

  async create(createJavadocDto: CreateJavadocDto, file: Express.Multer.File): Promise<Javadoc> {
    const project = await this.projectsService.findByShortLink(createJavadocDto.projectId);
    
    const targetFolder = `${project.shortLink}/${createJavadocDto.version}`;
    
    // Process the zip file (overwrites existing files in this folder)
    const folderName = await ZipHandler.extractZip(file, this.uploadDir, targetFolder);

    // Check if version already exists
    let javadoc = await this.javadocRepository.findOne({ 
      where: { 
        version: createJavadocDto.version,
        project: { id: project.id }
      } 
    });

    if (javadoc) {
      javadoc.storagePath = folderName;
      javadoc.uploadDate = new Date(); // Update upload date
      return this.javadocRepository.save(javadoc);
    }

    const newJavadoc = this.javadocRepository.create({
      version: createJavadocDto.version,
      storagePath: folderName,
      project: project,
    });

    return this.javadocRepository.save(newJavadoc);
  }

  async remove(id: string): Promise<void> {
    const javadoc = await this.javadocRepository.findOne({ where: { id } });
    if (!javadoc) {
      throw new NotFoundException(`Javadoc with ID ${id} not found`);
    }

    // Remove from DB
    await this.javadocRepository.remove(javadoc);

    // Remove from file system
    const fullPath = path.resolve(this.uploadDir, javadoc.storagePath);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  }
}
