import { Module } from '@nestjs/common';
import { OBSGateway } from './obs.gateway';
import { OBSClientService } from './obs-client.service';
import { OBSController } from './obs.controller';
import { OBSScheduler } from './obs.scheduler';
import { OBSAdminController } from './obs-admin.controller';
import { OBSInstanceService } from './obs-instance.service';

@Module({
  providers: [OBSGateway, OBSClientService, OBSInstanceService, OBSScheduler],
  controllers: [OBSController, OBSAdminController],
  exports: [OBSClientService, OBSInstanceService],
})
export class OBSModule {}
