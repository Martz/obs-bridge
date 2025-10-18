import { Module } from '@nestjs/common';
import { OBSGateway } from './obs.gateway';
import { OBSClientService } from './obs-client.service';
import { OBSController } from './obs.controller';
import { OBSScheduler } from './obs.scheduler';

@Module({
  providers: [OBSGateway, OBSClientService, OBSScheduler],
  controllers: [OBSController],
  exports: [OBSClientService],
})
export class OBSModule {}
