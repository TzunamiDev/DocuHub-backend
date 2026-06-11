import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { JavadocsService } from './src/javadocs/javadocs.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(JavadocsService);
  try {
    await service.remove('2a0b883d-1192-4ed4-9405-8322217502d8');
    console.log("Deleted successfully");
  } catch(e) {
    console.error(e);
  }
  await app.close();
}
bootstrap();
