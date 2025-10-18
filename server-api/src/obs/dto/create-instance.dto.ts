import { IsString, IsOptional, IsInt, Min, IsObject, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateInstanceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  clientId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  location?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
