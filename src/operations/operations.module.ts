import { Module, Global } from '@nestjs/common';
import { Database, getDatabase } from 'firebase/database';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { initializeApp } from 'firebase/app';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: Database,
      useFactory: (configService: ConfigService): Database => {
        const firebaseConfig = {
          apiKey: configService.get<string>('FIREBASE_API_KEY'),
          authDomain: configService.get<string>('FIREBASE_AUTH_DOMAIN'),
          databaseURL: configService.get<string>('FIREBASE_DATABASE_URL'),
          projectId: configService.get<string>('FIREBASE_PROJECT_ID'),
          messagingSenderId: configService.get<string>(
            'FIREBASE_MESSAGING_SENDER_ID',
          ),
          appId: configService.get<string>('FIREBASE_APP_ID'),
        };
        const app = initializeApp(firebaseConfig);
        return getDatabase(app);
      },
      inject: [ConfigService],
    },
  ],
  exports: [Database],
})
export class OperationsModule {}
