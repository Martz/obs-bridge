import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable WebSocket support
  app.useWebSocketAdapter(new WsAdapter(app));

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 8000;
  await app.listen(port);

  logger.log(`OBS Control Server running on port ${port}`);
  logger.log(`WebSocket endpoint: ws://localhost:${port}/obs`);
  logger.log(`Demo control panel: http://localhost:${port}`);
  logger.log(`HTTP API: http://localhost:${port}/api`);
}
bootstrap();
