import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { OBSClientService } from './obs-client.service';
import { OBSInstanceService } from './obs-instance.service';
import { SendCommandDto, BroadcastCommandDto } from './dto/command.dto';

@Controller('api')
export class OBSController {
  constructor(
    private readonly clientService: OBSClientService,
    private readonly instanceService: OBSInstanceService,
  ) {}

  @Get('clients')
  getClients() {
    const clients = this.clientService.getAllClients();
    return { clients };
  }

  @Post('command/:clientId')
  async sendCommand(
    @Param('clientId') clientId: string,
    @Body() commandDto: SendCommandDto,
  ) {
    // Check if instance exists in database
    const instance = await this.instanceService.findByClientId(clientId);
    if (!instance) {
      throw new NotFoundException(
        `OBS instance with client ID '${clientId}' not found`,
      );
    }

    // Check if WebSocket client is connected
    if (!this.clientService.hasClient(clientId)) {
      // Update status to offline if needed
      if (instance.status !== 'offline') {
        await this.instanceService.updateStatus(clientId, 'offline');
      }
      throw new ServiceUnavailableException(
        `OBS instance '${instance.name}' is not currently connected`,
      );
    }

    try {
      this.clientService.sendCommand(
        clientId,
        commandDto.command,
        commandDto.params || {},
      );
      return { success: true, message: 'Command sent' };
    } catch (error) {
      throw new BadRequestException('Failed to send command');
    }
  }

  @Post('broadcast')
  broadcastCommand(@Body() commandDto: BroadcastCommandDto) {
    const sent = this.clientService.broadcastCommand(
      commandDto.command,
      commandDto.params || {},
    );
    return { success: true, clientsSent: sent };
  }

  @Post('action/:clientId/:action')
  async sendAction(
    @Param('clientId') clientId: string,
    @Param('action') action: string,
  ) {
    // Check if instance exists in database
    const instance = await this.instanceService.findByClientId(clientId);
    if (!instance) {
      throw new NotFoundException(
        `OBS instance with client ID '${clientId}' not found`,
      );
    }

    // Check if WebSocket client is connected
    if (!this.clientService.hasClient(clientId)) {
      // Update status to offline if needed
      if (instance.status !== 'offline') {
        await this.instanceService.updateStatus(clientId, 'offline');
      }
      throw new ServiceUnavailableException(
        `OBS instance '${instance.name}' is not currently connected`,
      );
    }

    const commandMap: Record<string, string> = {
      'start-stream': 'StartStreaming',
      'stop-stream': 'StopStreaming',
      'start-recording': 'StartRecording',
      'stop-recording': 'StopRecording',
      status: 'GetStreamingStatus',
      scenes: 'GetSceneList',
    };

    const command = commandMap[action];
    if (!command) {
      throw new BadRequestException('Invalid action');
    }

    try {
      this.clientService.sendCommand(clientId, command);
      return { success: true, message: `Action '${action}' sent` };
    } catch (error) {
      throw new BadRequestException('Failed to send action');
    }
  }
}
