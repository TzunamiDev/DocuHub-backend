import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('JwtModule');
        let secret = configService.get<string>('app.jwtSecret');

        if (!secret) {
          if (fs.existsSync('./jwt_secret.txt')) {
            secret = fs.readFileSync('./jwt_secret.txt', 'utf-8').trim();
          } else {
            logger.warn('Generating ephemeral secret. Instance-isolated!');
            secret = crypto.randomBytes(32).toString('hex');
            fs.writeFileSync('./jwt_secret.txt', secret);
          }
        }

        return {
          secret,
          signOptions: { expiresIn: '24h' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
