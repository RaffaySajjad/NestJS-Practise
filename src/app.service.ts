import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { IP_API_FIELDS, calculateDistanceToUS } from './helpers/utils';
import { FixerResponse } from './operations/operations.service';

type IPApiResponse = {
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  currency: string;
};

@Injectable()
export class AppService {
  // Keep track of data locally to avoid unnecessary reads from Firebase
  private forexRates: FixerResponse | null = null;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getTraces(ip: string): Promise<string> {
    try {
      const cachedIpData: IPApiResponse = await this.cacheManager.get(ip);
      const countryTraces: {
        [key: string]: number;
      } = JSON.parse(await this.cacheManager.get('countryTraces'));

      console.log('TRACES:', countryTraces);

      this.forexRates =
        this.forexRates || (await this.cacheManager.get('forex'));

      let ipData = cachedIpData;
      if (!ipData) {
        console.log('Fetching data from IP API');
        const ipResponse = await fetch(
          `http://ip-api.com/json/${ip}?fields=${IP_API_FIELDS}`,
        );

        // Check headers for rate limiting
        const quoteLeft = ipResponse.headers.get('X-Rl');
        if (Number(quoteLeft) === 0) {
          console.log('Rate limit exceeded');
          throw new Error('Rate limit exceeded');
        }

        if (!ipResponse.ok) {
          throw new Error('Failed to fetch data from IP API');
        }

        ipData = await ipResponse.json();
        await this.cacheManager.set(
          ip,
          ipData,
          // Cache for 1 day since IP data doesn't change frequently
          24 * 60 * 60 * 1000,
        );
      }

      // If empty response, return error
      if (!ipData.country) {
        return JSON.stringify({
          error: 'Invalid IP address',
        });
      }

      const { currency, country, countryCode, lat, lon } = ipData;

      // Since fixer.io doesn't allow changing base currency in the free plan we need to calculate the exchange rate with USD
      const exchangeRate =
        this.forexRates.rates.USD / this.forexRates.rates[currency];

      const distanceFromUS = calculateDistanceToUS({
        lat,
        lon,
      });

      const result = {
        ip,
        name: country,
        code: countryCode,
        lat,
        lon,
        currencies: [
          {
            iso: currency,
            symbol: '',
            // Units of USD per 1 unit of currency
            conversion_rate: exchangeRate,
          },
          // Assumption: USD being global currency, is always supported
          currency !== 'USD' && {
            iso: 'USD',
            symbol: '$',
            conversion_rate: 1,
          },
        ].filter(Boolean),
        distance_to_usa: distanceFromUS,
      };

      const longestDistanceYet: {
        country: string;
        value: number;
      } = await this.cacheManager.get('longestDistanceYet');

      const longestDistance = {
        country,
        value: distanceFromUS,
      };

      if (!longestDistanceYet || distanceFromUS > longestDistanceYet.value) {
        await this.cacheManager.set('longestDistanceYet', longestDistance, 0);
      }

      const countryTrace = countryTraces[country];
      const count = (countryTrace || 0) + 1;

      const updatedTraces = {
        ...countryTraces,
        [country]: count,
      };

      await this.cacheManager.set(
        'countryTraces',
        JSON.stringify(updatedTraces),
        0,
      );

      const mostTracedCountry: {
        country: string;
        count: number;
      } = await this.cacheManager.get('mostTracedCountry');
      if (!mostTracedCountry || count > mostTracedCountry.count) {
        await this.cacheManager.set(
          'mostTracedCountry',
          {
            country,
            count,
          },
          0,
        );
      }

      // Update cache
      await this.cacheManager.set(
        'statistics',
        {
          longestDistance: longestDistance,
          mostTracedCountry,
        },
        // No cache expiry
        0,
      );

      return JSON.stringify(result);
    } catch (error) {
      console.error(error);
      return JSON.stringify({
        error: 'Something went wrong. Please try again later.',
      });
    }
  }

  async getStatistics(): Promise<string> {
    const cachedData = await this.cacheManager.get('statistics');

    return JSON.stringify({
      // @ts-expect-error - TS doesn't know that cacheManager is injected
      longest_distance: cachedData?.longestDistance || {},
      // @ts-expect-error - TS doesn't know that cacheManager is injected
      most_traced: cachedData?.mostTracedCountry || {},
    });
  }
}
