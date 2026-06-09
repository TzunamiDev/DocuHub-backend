import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Javadoc } from './entities/javadoc.entity';
import { CreateJavadocDto } from './dto/create-javadoc.dto';
import { ZipHandler } from './utils/zip-handler';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class JavadocsService {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(Javadoc)
    private javadocRepository: Repository<Javadoc>,
    private configService: ConfigService,
  ) {
    this.uploadDir = path.resolve(this.configService.get<string>('app.uploadDir') || 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async findAll(search?: string): Promise<Javadoc[]> {
    if (search) {
      return this.javadocRepository.find({
        where: [
          { title: Like(`%${search}%`) },
          { description: Like(`%${search}%`) },
          // Simple-array in TypeORM searches within the CSV string, so Like works for basic tags matching
          { tags: Like(`%${search}%`) }
        ],
        order: { uploadDate: 'DESC' }
      });
    }
    return this.javadocRepository.find({ order: { uploadDate: 'DESC' } });
  }

  async findPopular(limit: number = 3): Promise<Javadoc[]> {
    return this.javadocRepository.find({
      order: { views: 'DESC' },
      take: limit,
    });
  }

  async findRecent(limit: number = 10): Promise<Javadoc[]> {
    return this.javadocRepository.find({
      order: { uploadDate: 'DESC' },
      take: limit,
    });
  }

  async findOne(id: string): Promise<Javadoc> {
    const javadoc = await this.javadocRepository.findOne({ where: { id } });
    if (!javadoc) {
      throw new NotFoundException(`Javadoc with ID ${id} not found`);
    }
    
    // Increment views
    javadoc.views += 1;
    await this.javadocRepository.save(javadoc);
    
    return javadoc;
  }

  async create(createJavadocDto: CreateJavadocDto, file: Express.Multer.File): Promise<Javadoc> {
    // Process the zip file
    const folderName = await ZipHandler.extractZip(file, this.uploadDir);

    const tagsArray = createJavadocDto.tags
      ? createJavadocDto.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      : [];

    const newJavadoc = this.javadocRepository.create({
      title: createJavadocDto.title,
      description: createJavadocDto.description,
      version: createJavadocDto.version,
      author: createJavadocDto.author,
      tags: tagsArray,
      storagePath: folderName,
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
