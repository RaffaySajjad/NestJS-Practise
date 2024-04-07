import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { Database, get, ref, update } from 'firebase/database';

export type FixerResponse = {
  success: boolean;
  timestamp: number;
  base: string;
  date: string;
  rates: {
    [key: string]: number;
  };
};

@Injectable()
export class OperationsService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private db: Database,
    private configService: ConfigService,
  ) {}

  async updateExchangeRates() {
    const FIXER_ACCESS_KEY = this.configService.get<string>('FIXER_ACCESS_KEY');

    const fixerResponse = await fetch(
      `http://data.fixer.io/api/latest?access_key=${FIXER_ACCESS_KEY}`,
    );

    if (!fixerResponse.ok) {
      throw new Error('Failed to fetch data from Fixer API');
    }

    const fixerData: FixerResponse = await fixerResponse.json();
    await this.cacheManager.set('forex', fixerData, 24 * 60 * 60 * 1000);

    try {
      await update(ref(this.db, '/forex'), fixerData);
      console.log('Data inserted successfully.');
    } catch (error) {
      console.error('Failed to insert data:', error);
    }
  }

  async refreshDataIfNeeded(): Promise<boolean> {
    const snapshot = await get(ref(this.db, '/forex/timestamp'));
    if (snapshot.exists()) {
      // Convert timestamp to milliseconds since API returns seconds
      const timestamp = snapshot.val() * 1000;
      const currentTime = Date.now();

      console.log('Current time:', currentTime);
      console.log('Timestamp:', timestamp);

      // Refresh data if it's older than 24 hours
      if (currentTime - timestamp > 24 * 60 * 60 * 1000) {
        console.log('Data is older than 24 hours. Refreshing data...');
        await this.updateExchangeRates();
        return true;
      } else {
        console.log('Forex is up to date.');
      }
    } else {
      console.log('Forex data is not available. Inserting data...');
      await this.updateExchangeRates();
      return true;
    }
  }

  async setCache() {
    const countryTraces = await get(ref(this.db, '/countryTraces'));
    const statistics = await get(ref(this.db, '/statistics'));
    const forexRates = await get(ref(this.db, '/forex'));
    const longestDistanceYet = await get(
      ref(this.db, '/statistics/longestDistance'),
    );
    const mostTracedCountry = await get(
      ref(this.db, '/statistics/mostTracedCountry'),
    );

    const traces = countryTraces.val();

    await this.cacheManager.set(
      'countryTraces',
      JSON.stringify(traces || {}),
      0,
    );
    await this.cacheManager.set('statistics', statistics.val(), 0);
    await this.cacheManager.set('forex', forexRates.val(), 0);
    await this.cacheManager.set(
      'longestDistanceYet',
      longestDistanceYet.val(),
      0,
    );
    await this.cacheManager.set(
      'mostTracedCountry',
      mostTracedCountry.val(),
      0,
    );
  }
}
