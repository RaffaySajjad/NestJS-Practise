import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { OperationsModule } from './operations/operations.module';
import { OperationsService } from './operations/operations.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './operations/tasks.service';

@Module({
  imports: [
    OperationsModule,
    ConfigModule.forRoot(),
    CacheModule.register(),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService, OperationsService, TasksService],
})
export class AppModule {}
