import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const port = Number(process.env.PORT) || 4000;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  app.use(helmet());
  app.use(cookieParser(process.env.SESSION_SECRET));

  // In production the API sits on a different root domain than the front,
  // so we need `credentials: true` + an explicit origin (no wildcard).
  app.enableCors({
    origin: frontendUrl.split(',').map((u) => u.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // Trust the proxy in front (Render terminates TLS) so Express reports the
  // correct protocol — needed for Secure cookies.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Droxyde API')
      .setDescription('Droxyde backend — REST API')
      .setVersion('0.1.0')
      .addCookieAuth(process.env.SESSION_COOKIE_NAME || 'droxyde.sid')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { withCredentials: true },
    });
  }

  await app.listen(port, '0.0.0.0');
  Logger.log(`🚀 Droxyde API ready on http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal bootstrap error', err);
  process.exit(1);
});
