import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Javadoc } from './entities/javadoc.entity';
import { CreateJavadocDto } from './dto/create-javadoc.dto';
import { ZipHandler } from './utils/zip-handler';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Response, Request } from 'express';
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
    private jwtService: JwtService,
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
    
    // Check if version already exists BEFORE deleting the folder
    let javadoc = await this.javadocRepository.findOne({ 
      where: { 
        version: createJavadocDto.version,
        project: { id: project.id }
      } 
    });

    let tempJsonPath: string | null = null;
    let preservedJsonDocsPath: string | null = null;

    if (javadoc && javadoc.jsonDocsPath) {
      const fullJsonPath = path.resolve(this.uploadDir, javadoc.jsonDocsPath);
      if (fs.existsSync(fullJsonPath)) {
        // Move to a temporary file in the uploadDir itself to avoid cross-device link errors
        tempJsonPath = path.resolve(this.uploadDir, `temp-${Date.now()}-json-docs.zip`);
        fs.renameSync(fullJsonPath, tempJsonPath);
        preservedJsonDocsPath = javadoc.jsonDocsPath;
      }
    }

    const targetFolder = `${project.shortLink}/${createJavadocDto.version}`;
    
    // Process the zip file (overwrites existing files in this folder, wipes folder first)
    const folderName = await ZipHandler.extractZip(file, this.uploadDir, targetFolder);

    // If we preserved a JSON file, move it back into the newly created folder
    if (tempJsonPath && preservedJsonDocsPath) {
      const fullJsonPath = path.resolve(this.uploadDir, preservedJsonDocsPath);
      const jsonDir = path.dirname(fullJsonPath);
      if (!fs.existsSync(jsonDir)) {
        fs.mkdirSync(jsonDir, { recursive: true });
      }
      fs.renameSync(tempJsonPath, fullJsonPath);
    }

    if (javadoc) {
      javadoc.storagePath = folderName;
      javadoc.uploadDate = new Date(); // Update upload date
      
      if (!tempJsonPath) {
        // Only clear if we didn't preserve the JSON file
        javadoc.jsonDocsPath = null; 
      } else {
        javadoc.jsonDocsPath = preservedJsonDocsPath;
      }
      
      return this.javadocRepository.save(javadoc);
    }

    const newJavadoc = this.javadocRepository.create({
      version: createJavadocDto.version,
      storagePath: folderName,
      project: project,
    });

    return this.javadocRepository.save(newJavadoc);
  }

  
  async uploadJsonDocs(id: string, file: Express.Multer.File): Promise<Javadoc> {
    const javadoc = await this.javadocRepository.findOne({ where: { id }, relations: { project: true } });
    if (!javadoc) {
      throw new NotFoundException(`Javadoc with ID ${id} not found`);
    }

    const project = javadoc.project;
    const extension = path.extname(file.originalname);
    const targetFolder = `${project.shortLink}/${javadoc.version}`;
    const fullFolderPath = path.resolve(this.uploadDir, targetFolder);
    
    if (!fs.existsSync(fullFolderPath)) {
      fs.mkdirSync(fullFolderPath, { recursive: true });
    }

    const fileName = `json-docs${extension}`;
    const filePath = path.join(fullFolderPath, fileName);
    if (file.path) {
      fs.copyFileSync(file.path, filePath);
      fs.unlinkSync(file.path);
    } else {
      fs.writeFileSync(filePath, file.buffer);
    }

    javadoc.jsonDocsPath = path.join(targetFolder, fileName).replace(/\\/g, '/');
    return this.javadocRepository.save(javadoc);
  }

  async downloadJsonDocs(id: string, res: Response, req: Request): Promise<void> {
    const javadoc = await this.javadocRepository.findOne({ where: { id }, relations: { project: true } });
    if (!javadoc) {
      throw new NotFoundException(`Javadoc with ID ${id} not found`);
    }

    if (!javadoc.jsonDocsPath) {
      throw new NotFoundException(`No JSON docs uploaded for this version`);
    }

    if (javadoc.project.jsonDocsRequireAuth) {
      const token = req.cookies?.['Authentication'];
      if (!token) {
        throw new UnauthorizedException('Authentication required to download JSON docs');
      }
      try {
        this.jwtService.verify(token);
      } catch (e) {
        throw new UnauthorizedException('Invalid or expired token');
      }
    }

    const fullPath = path.resolve(this.uploadDir, javadoc.jsonDocsPath);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException(`File not found on server`);
    }

    const ext = path.extname(fullPath);
    const downloadName = `${javadoc.project.shortLink}-${javadoc.version}-json-docs${ext}`;
    res.download(fullPath, downloadName);
  }

  async remove(id: string): Promise<void> {
    const javadoc = await this.javadocRepository.findOne({ where: { id } });
    if (!javadoc) {
      throw new NotFoundException(`Javadoc with ID ${id} not found`);
    }

    // Remove from DB
    await this.javadocRepository.delete(id);

    // Remove from file system
    const fullPath = path.resolve(this.uploadDir, javadoc.storagePath);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  }
}
