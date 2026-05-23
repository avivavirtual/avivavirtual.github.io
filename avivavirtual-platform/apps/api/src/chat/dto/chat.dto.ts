import { IsEmail, IsString, MinLength } from 'class-validator';

export class StartChatDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  message!: string;
}

export class SendChatMessageDto {
  @IsString()
  @MinLength(1)
  message!: string;
}
