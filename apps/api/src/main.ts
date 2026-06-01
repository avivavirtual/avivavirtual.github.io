import compression from 'compression';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

function configuredOrigins(config: ConfigService) {
  return [config.get<string>('APP_URL'), ...(config.get<string>('WIDGET_ALLOWED_ORIGINS') ?? '').split(',')]
    .map((origin) => origin?.trim())
    .filter(Boolean) as string[];
}

function isAllowedWidgetOrigin(origin: string, config: ConfigService) {
  const explicitOrigins = configuredOrigins(config);
  if (explicitOrigins.includes(origin)) return true;
  const allowedDomains = (config.get<string>('WIDGET_ALLOWED_DOMAINS') ?? 'localhost,rogers-demo.ca,mapleleaf-demo.ca')
    .split(',')
    .map((domain) => domain.trim())
    .filter(Boolean);
  try {
    const hostname = new URL(origin).hostname;
    return allowedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || isAllowedWidgetOrigin(origin, config)) return callback(null, true);
      return callback(new Error('CORS origin is not allowed'));
    },
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));

  const swagger = new DocumentBuilder()
    .setTitle('AvivaVirtual API')
    .setDescription('Multi-tenant AI customer care outsourcing control plane')
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swagger));

  await app.listen(config.get<number>('PORT') ?? 3001);
}

void bootstrap();
