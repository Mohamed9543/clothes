import * as dns from 'node:dns';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvConfig } from './config/env.validation';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// Some local/corporate DNS resolvers refuse SRV lookups (required by mongodb+srv:// URIs).
// Fall back to public resolvers so MongoDB Atlas SRV records resolve correctly.
dns.setServers([...dns.getServers(), '8.8.8.8', '8.8.4.4']);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const configService = app.get(ConfigService<EnvConfig, true>);
  const port = configService.get('PORT', { infer: true });

  await app.listen(port);
}
bootstrap();
