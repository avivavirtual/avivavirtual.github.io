import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AiController } from './ai.controller';
import { EmbeddingService } from './embedding.service';
import { RagService } from './rag.service';
import { SuggestService } from './suggest.service';
import { VoiceAiService } from './voice-ai.service';

@Module({ imports: [AuthModule], controllers: [AiController], providers: [RagService, EmbeddingService, SuggestService, VoiceAiService], exports: [RagService, SuggestService] })
export class AiModule {}
