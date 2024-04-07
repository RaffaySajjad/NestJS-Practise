import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Cache } from 'cache-manager';
import { Database, ref, set } from 'firebase/database';

@Injectable()
export class TasksService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private db: Database,
  ) {}
  private readonly logger = new Logger(TasksService.name);

  async writeData(path: string, data: any): Promise<void> {
    await set(ref(this.db, path), data);
  }

  @Cron('0 * * * *')
  async handleCron() {
    // Push updated data to firebase
    const countryTraces = JSON.parse(
      await this.cacheManager.get('countryTraces'),
    );
    const statistics = await this.cacheManager.get('statistics');

    console.log('About to upload: countryTraces', countryTraces);
    console.log('About to upload: statistics', statistics);

    await this.writeData('/countryTraces', countryTraces);
    await this.writeData('/statistics', statistics);

    this.logger.debug('Updated Firebase with latest data.');
  }
}
