import { AgentAvailabilityType } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  passwordHash?: string;
}

export class UpdateAgentStatusDto {
  @IsEnum(AgentAvailabilityType)
  status!: AgentAvailabilityType;
}
