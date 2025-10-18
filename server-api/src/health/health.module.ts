import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { OBSModule } from '../obs/obs.module';

@Module({
  imports: [OBSModule],
  controllers: [HealthController],
})
export class HealthModule {}
