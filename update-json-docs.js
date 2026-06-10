const fs = require('fs');

let controller = fs.readFileSync('src/javadocs/javadocs.controller.ts', 'utf8');
controller = controller.replace(
  "@UseInterceptors(FileInterceptor('file'))\n  uploadJsonDocs(",
  `@UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: os.tmpdir(),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
      }
    })
  }))\n  uploadJsonDocs(`
);
fs.writeFileSync('src/javadocs/javadocs.controller.ts', controller);

let service = fs.readFileSync('src/javadocs/javadocs.service.ts', 'utf8');
service = service.replace(
  "fs.writeFileSync(filePath, file.buffer);",
  "if (file.path) {\n      fs.copyFileSync(file.path, filePath);\n      fs.unlinkSync(file.path);\n    } else {\n      fs.writeFileSync(filePath, file.buffer);\n    }"
);
fs.writeFileSync('src/javadocs/javadocs.service.ts', service);
