import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OBSClientService } from './obs-client.service';

@Injectable()
export class OBSScheduler {
  private readonly logger = new Logger(OBSScheduler.name);

  constructor(private readonly clientService: OBSClientService) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  handlePingClients() {
    const clientIds = this.clientService.getConnectedClientIds();
    if (clientIds.length > 0) {
      this.logger.debug(`Pinging ${clientIds.length} client(s)`);
      this.clientService.pingAll();
    }
  }
}
