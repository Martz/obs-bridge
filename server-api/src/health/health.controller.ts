import { Controller, Get } from '@nestjs/common';
import { OBSClientService } from '../obs/obs-client.service';

@Controller('health')
export class HealthController {
  constructor(private readonly clientService: OBSClientService) {}

  @Get()
  check() {
    return {
      status: 'ok',
      clients: this.clientService.getClientCount(),
      uptime: process.uptime(),
    };
  }
}
