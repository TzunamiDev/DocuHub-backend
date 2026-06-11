import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private dataSource: DataSource) {}

  @Get()
  async check() {
    try {
      if (this.dataSource.isInitialized) {
        await this.dataSource.query('SELECT 1');
        return { status: 'ok', timestamp: new Date() };
      } else {
        return { status: 'degraded', reason: 'Database not initialized', timestamp: new Date() };
      }
    } catch (error) {
      return { status: 'degraded', reason: 'Database connection failed', timestamp: new Date() };
    }
  }
}
