import { IsString, IsOptional, IsObject } from 'class-validator';

export class SendCommandDto {
  @IsString()
  command!: string;

  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;
}

export class BroadcastCommandDto {
  @IsString()
  command!: string;

  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;
}
