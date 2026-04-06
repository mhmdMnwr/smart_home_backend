import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Use global validation pipes and filters
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Database verification
  const logger = new Logger('DatabaseVerification');
  const connection = app.get<Connection>(getConnectionToken());
  
  if (connection.readyState === 1) {
    logger.log('✅ Successfully connected to the database');
  } else {
    logger.error('❌ Failed to connect to the database');
  }

  // Provide a fallback port just in case process.env.PORT is undefined
  await app.listen(process.env.PORT!);
}
bootstrap();
