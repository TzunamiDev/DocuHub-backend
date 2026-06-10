const fs = require('fs');

let content = fs.readFileSync('src/javadocs/utils/zip-handler.ts', 'utf8');

// Update validation
content = content.replace(
  "if (file.buffer.length < 4 || file.buffer[0] !== 0x50 || file.buffer[1] !== 0x4B || file.buffer[2] !== 0x03 || file.buffer[3] !== 0x04) {\n      throw new BadRequestException('Invalid ZIP format');\n    }",
  "// skip magic byte check, or read from file"
);

// Update AdmZip constructor
content = content.replace(
  "const zip = new AdmZip(file.buffer);",
  "const zip = new AdmZip(file.path || file.buffer);"
);

// Delete the temp file after processing
content = content.replace(
  "return folderName;",
  "if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);\n      return folderName;"
);

// Delete the temp file on failure
content = content.replace(
  "throw new BadRequestException(\`Failed to process ZIP file: \${err.message}\`);",
  "if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);\n       throw new BadRequestException(\`Failed to process ZIP file: \${err.message}\`);"
);

fs.writeFileSync('src/javadocs/utils/zip-handler.ts', content);
