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
      
      // Poll for status updates
      this.logger.debug(`Polling status for ${clientIds.length} client(s)`);
      for (const clientId of clientIds) {
        try {
          this.clientService.sendCommand(clientId, 'GetStreamingStatus');
          this.clientService.sendCommand(clientId, 'GetRecordingStatus');
          this.clientService.sendCommand(clientId, 'GetSceneList');
        } catch (error) {
          this.logger.error(`Failed to poll status for ${clientId}:`, error);
        }
      }
    }
  }
}
