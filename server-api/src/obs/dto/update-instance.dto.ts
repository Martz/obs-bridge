import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateInstanceDto } from './create-instance.dto';

export class UpdateInstanceDto extends PartialType(
  OmitType(CreateInstanceDto, ['clientId'] as const)
) {}
