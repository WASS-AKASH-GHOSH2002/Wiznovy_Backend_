import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'node:path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  const config = new DocumentBuilder()
    .setTitle('WIZNOVY Server')
    .setDescription('The WIZNOVY server API description')
    .setVersion('1.0')
    .addTag('WIZNOVY Server')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    index: false,
    prefix: 'uploads',
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.enableCors();
  await app.listen(process.env.SERVER_PORT || '3000');
  
}
bootstrap();
