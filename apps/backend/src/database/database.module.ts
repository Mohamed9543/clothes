import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EnvConfig } from '../config/env.validation';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvConfig, true>) => ({
        uri: configService.get('MONGODB_URI', { infer: true }),
      }),
    }),
  ],
})
export class DatabaseModule {}
