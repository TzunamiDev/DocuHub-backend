import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { UsersService } from '../../users/users.service';
import { SettingsService } from '../../settings/settings.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const settingsService = app.get(SettingsService);

  console.log('Seeding database...');

  // Configure settings
  await settingsService.setValue('MAX_UPLOAD_SIZE', '80');
  console.log('Settings seeded.');

  // Check if admin user exists
  const existingAdmin = await usersService.findByUsername('admin');
  if (!existingAdmin) {
    const randomPassword = crypto.randomBytes(8).toString('hex');
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(randomPassword, salt);

    await usersService.create({
      username: 'admin',
      passwordHash: passwordHash,
      role: 'admin' as any,
    });
    console.log('-------------------------------------------');
    console.log('Admin user created successfully.');
    console.log(`Username: admin`);
    console.log(`Password: ${randomPassword}`);
    console.log('Please save this password securely.');
    console.log('-------------------------------------------');
  } else {
    console.log('Admin user already exists. Skipping user creation.');
  }

  await app.close();
}

bootstrap();
