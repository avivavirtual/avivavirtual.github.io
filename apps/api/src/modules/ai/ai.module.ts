import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { EmbeddingService } from './embedding.service';
import { RagService } from './rag.service';
import { SuggestService } from './suggest.service';
import { VoiceAiService } from './voice-ai.service';

@Module({ controllers: [AiController], providers: [RagService, EmbeddingService, SuggestService, VoiceAiService], exports: [RagService, SuggestService] })
export class AiModule {}
