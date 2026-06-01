import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VoipController } from './voip.controller';
import { VoipService } from './voip.service';

@Module({ imports: [AuthModule], controllers: [VoipController], providers: [VoipService], exports: [VoipService] })
export class VoipModule {}
