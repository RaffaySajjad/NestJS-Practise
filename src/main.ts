import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { OperationsService } from './operations/operations.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const firebaseService = app.get(OperationsService);
  await firebaseService.refreshDataIfNeeded();
  await firebaseService.setCache();

  await app.listen(3000);
}
bootstrap();
