import { Body, Controller, Get, HttpException, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getPing(): string {
    return 'Hello World!';
  }

  @Post('/traces')
  async getTraces(@Body('ip') ip: string): Promise<string> {
    const ipRegex = /^(?:(?:\d{1,3}\.){3}\d{1,3})$/;

    if (!ip) {
      throw new HttpException('IP is required', 400);
    }

    if (!ipRegex.test(ip)) {
      throw new HttpException('Invalid IP', 400);
    }

    return await this.appService.getTraces(ip);
  }

  @Get('/statistics')
  async getStatistics(): Promise<string> {
    return await this.appService.getStatistics();
  }
}
