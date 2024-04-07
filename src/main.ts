import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { OperationsService } from './operations/operations.service';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const firebaseService = app.get(OperationsService);
  await firebaseService.refreshDataIfNeeded();
  await firebaseService.setCache();

  const PORT = configService.get<string>('PORT');
  await app.listen(PORT);
}
bootstrap();
