const fs = require('fs');

let content = fs.readFileSync('src/javadocs/javadocs.service.ts', 'utf8');

content = content.replace("import { Injectable, NotFoundException } from '@nestjs/common';", "import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';");
content = content.replace("import { ConfigService } from '@nestjs/config';", "import { ConfigService } from '@nestjs/config';\nimport { JwtService } from '@nestjs/jwt';\nimport { Response, Request } from 'express';");

content = content.replace("private configService: ConfigService,", "private configService: ConfigService,\n    private jwtService: JwtService,");

const methodsToAdd = `
  async uploadJsonDocs(id: string, file: Express.Multer.File): Promise<Javadoc> {
    const javadoc = await this.javadocRepository.findOne({ where: { id }, relations: { project: true } });
    if (!javadoc) {
      throw new NotFoundException(\`Javadoc with ID \${id} not found\`);
    }

    const project = javadoc.project;
    const extension = path.extname(file.originalname);
    const targetFolder = \`\${project.shortLink}/\${javadoc.version}\`;
    const fullFolderPath = path.resolve(this.uploadDir, targetFolder);
    
    if (!fs.existsSync(fullFolderPath)) {
      fs.mkdirSync(fullFolderPath, { recursive: true });
    }

    const fileName = \`json-docs\${extension}\`;
    const filePath = path.join(fullFolderPath, fileName);
    fs.writeFileSync(filePath, file.buffer);

    javadoc.jsonDocsPath = path.join(targetFolder, fileName).replace(/\\\\/g, '/');
    return this.javadocRepository.save(javadoc);
  }

  async downloadJsonDocs(id: string, res: Response, req: Request): Promise<void> {
    const javadoc = await this.javadocRepository.findOne({ where: { id }, relations: { project: true } });
    if (!javadoc) {
      throw new NotFoundException(\`Javadoc with ID \${id} not found\`);
    }

    if (!javadoc.jsonDocsPath) {
      throw new NotFoundException(\`No JSON docs uploaded for this version\`);
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
      throw new NotFoundException(\`File not found on server\`);
    }

    res.download(fullPath);
  }
`;

content = content.replace("async remove(id: string): Promise<void> {", methodsToAdd + "\n  async remove(id: string): Promise<void> {");

fs.writeFileSync('src/javadocs/javadocs.service.ts', content);
