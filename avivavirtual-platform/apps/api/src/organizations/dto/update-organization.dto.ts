import { LanguageType } from '@prisma/client';
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
  supportHours?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  escalationRules?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(LanguageType)
  preferredLanguage?: LanguageType;

  @IsOptional()
  @IsBoolean()
  widgetEnabled?: boolean;
}
