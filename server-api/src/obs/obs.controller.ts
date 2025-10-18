import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OBSClientService } from './obs-client.service';
import { SendCommandDto, BroadcastCommandDto } from './dto/command.dto';

@Controller('api')
export class OBSController {
  constructor(private readonly clientService: OBSClientService) {}

  @Get('clients')
  getClients() {
    const clients = this.clientService.getAllClients();
    return { clients };
  }

  @Post('command/:clientId')
  sendCommand(
    @Param('clientId') clientId: string,
    @Body() commandDto: SendCommandDto,
  ) {
    if (!this.clientService.hasClient(clientId)) {
      throw new NotFoundException('Client not found');
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
  sendAction(
    @Param('clientId') clientId: string,
    @Param('action') action: string,
  ) {
    if (!this.clientService.hasClient(clientId)) {
      throw new NotFoundException('Client not found');
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
