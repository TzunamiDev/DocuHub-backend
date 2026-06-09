import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
  ) {}

  async getValue(key: string, defaultValue: string): Promise<string> {
    const setting = await this.settingsRepository.findOne({ where: { key } });
    if (setting) {
      return setting.value;
    }
    return defaultValue;
  }

  async setValue(key: string, value: string): Promise<Setting> {
    let setting = await this.settingsRepository.findOne({ where: { key } });
    if (!setting) {
      setting = this.settingsRepository.create({ key, value });
    } else {
      setting.value = value;
    }
    return this.settingsRepository.save(setting);
  }
}
