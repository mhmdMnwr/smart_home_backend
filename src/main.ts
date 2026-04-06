import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  // Database verification
  const logger = new Logger('DatabaseVerification');
  const connection = app.get<Connection>(getConnectionToken());
  
  if (connection.readyState === 1) {
    logger.log('✅ Successfully connected to the database');
  } else {
    logger.error('❌ Failed to connect to the database');
  }

  // Provide a fallback port just in case process.env.PORT is undefined
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
