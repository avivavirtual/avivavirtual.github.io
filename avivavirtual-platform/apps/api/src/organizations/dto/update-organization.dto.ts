import { LanguageType, Prisma } from '@prisma/client';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  brandColor?: string;
}

export class UpdateClientSettingsDto {
  @IsOptional()
  @IsObject()
  supportHours?: Prisma.InputJsonObject;

  @IsOptional()
  @IsObject()
  escalationRules?: Prisma.InputJsonObject;

  @IsOptional()
  @IsEnum(LanguageType)
  preferredLanguage?: LanguageType;

  @IsOptional()
  @IsBoolean()
  widgetEnabled?: boolean;
}
