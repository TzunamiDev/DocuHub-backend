const fs = require('fs');

let content = fs.readFileSync('src/javadocs/javadocs.controller.ts', 'utf8');

// Import diskStorage from multer
content = content.replace(
  "import { FileInterceptor } from '@nestjs/platform-express';",
  "import { FileInterceptor } from '@nestjs/platform-express';\nimport { diskStorage } from 'multer';\nimport { extname } from 'path';\nimport * as os from 'os';"
);

// Update FileInterceptor for 'create'
const diskStorageConfig = `
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: os.tmpdir(),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
      }
    })
  }))
`;
content = content.replace(
  "@UseInterceptors(FileInterceptor('file'))\n  create(",
  diskStorageConfig.trim() + "\n  create("
);

fs.writeFileSync('src/javadocs/javadocs.controller.ts', content);
