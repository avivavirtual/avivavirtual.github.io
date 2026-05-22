import { Role } from '@prisma/client';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  organizationName!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class RefreshDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  role: Role;
}
