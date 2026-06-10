import { BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import AdmZip from 'adm-zip';
import * as crypto from 'crypto';
export class ZipHandler {
  static async extractZip(file: Express.Multer.File, uploadDir: string, targetFolderName?: string): Promise<string> {
    // Basic validation for zip extension
    if (!file.originalname.toLowerCase().endsWith('.zip')) {
      throw new BadRequestException('File must be a ZIP archive');
    }

    // Validate magic bytes (PK\x03\x04)
    // skip magic byte check, or read from file

    // Generate unique folder name or use provided
    const folderName = targetFolderName || crypto.randomUUID();
    const destDir = path.resolve(uploadDir, folderName);

    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true, force: true });
    }

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    try {
      const zip = new AdmZip(file.path || file.buffer);
      const zipEntries = zip.getEntries();

      for (const entry of zipEntries) {
        // Prevent directory traversal attacks
        if (entry.entryName.includes('../') || entry.entryName.includes('..\\')) {
          throw new BadRequestException('ZIP contains invalid paths (directory traversal detected)');
        }

        const fullPath = path.resolve(destDir, entry.entryName);
        
        // Strict boundary check: ensure the resolved path is strictly inside the destination directory
        if (!fullPath.startsWith(destDir + path.sep) && fullPath !== destDir) {
            throw new BadRequestException('ZIP contains paths escaping the extraction directory');
        }

        if (!entry.isDirectory) {
          const content = zip.readFile(entry);
          if (content) {
             const dirname = path.dirname(fullPath);
             if (!fs.existsSync(dirname)) {
                fs.mkdirSync(dirname, { recursive: true });
             }
             fs.writeFileSync(fullPath, content);
          }
        }
      }

      if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return folderName;
    } catch (err) {
       // Cleanup on failure
       if (fs.existsSync(destDir)) {
           fs.rmSync(destDir, { recursive: true, force: true });
       }
       if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
       throw new BadRequestException(`Failed to process ZIP file: ${err.message}`);
    }
  }
}
