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

@Controller('api/admin/instances')
export class OBSAdminController {
  constructor(private readonly instanceService: OBSInstanceService) {}

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
}
