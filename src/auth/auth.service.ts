import { Injectable, UnauthorizedException, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async onApplicationBootstrap() {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminUsername && adminPassword) {
      const existingUser = await this.usersService.findByUsername(adminUsername);
      if (!existingUser) {
        this.logger.log(`Creating default admin user from environment variables: ${adminUsername}`);
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(adminPassword, salt);

        await this.usersService.create({
          username: adminUsername,
          passwordHash,
          role: 'admin' as any,
        });
        this.logger.log(`Admin user '${adminUsername}' created successfully.`);
      } else {
        // Optional: Update password if we want the env variable to be the source of truth,
        // but typically we just seed it once. We'll leave it as is.
        this.logger.log(`Admin user '${adminUsername}' already exists. Skipping creation.`);
      }
    }
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (user && await bcrypt.compare(pass, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { username: user.username, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
