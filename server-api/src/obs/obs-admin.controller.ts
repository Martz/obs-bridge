import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { OBSInstanceService } from './obs-instance.service';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { UpdateInstanceDto } from './dto/update-instance.dto';
import { AuthService } from './auth.service';

@Controller('api/admin/instances')
export class OBSAdminController {
  constructor(
    private readonly instanceService: OBSInstanceService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  create(@Body() dto: CreateInstanceDto) {
    return this.instanceService.create(dto);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.instanceService.findAll(status, page, limit);
  }

  @Get('stats')
  getStats() {
    return this.instanceService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.instanceService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInstanceDto) {
    return this.instanceService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.instanceService.delete(id);
  }

  // Token Management Endpoints

  @Post(':id/token/generate')
  async generateToken(@Param('id') id: string) {
    const instance = await this.instanceService.findOne(id);
    if (!instance) {
      return { error: 'Instance not found' };
    }

    const token = await this.authService.generateTokenForInstance(instance.clientId);

    return {
      message: 'Token generated successfully',
      clientId: instance.clientId,
      token,
      tokenCreatedAt: new Date().toISOString(),
    };
  }

  @Post(':id/token/revoke')
  @HttpCode(HttpStatus.OK)
  async revokeToken(@Param('id') id: string) {
    const instance = await this.instanceService.findOne(id);
    if (!instance) {
      return { error: 'Instance not found' };
    }

    await this.authService.revokeToken(instance.clientId);

    return {
      message: 'Token revoked successfully',
      clientId: instance.clientId,
    };
  }

  @Get(':id/token/info')
  async getTokenInfo(@Param('id') id: string) {
    const instance = await this.instanceService.findOne(id);
    if (!instance) {
      return { error: 'Instance not found' };
    }

    return {
      clientId: instance.clientId,
      hasToken: !!instance.apiToken,
      tokenCreatedAt: instance.tokenCreatedAt,
      tokenLastUsedAt: instance.tokenLastUsedAt,
    };
  }
}
