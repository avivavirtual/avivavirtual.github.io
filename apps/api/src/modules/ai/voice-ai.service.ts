import { Injectable } from '@nestjs/common';
import { RagService } from './rag.service';

@Injectable()
export class VoiceAiService {
  private readonly silenceThresholdMs = 800;

  constructor(private readonly rag: RagService) {}

  getTurnTakingConfig() {
    return { vadSilenceThresholdMs: this.silenceThresholdMs, aiBridgeSubAccount: process.env.VOIPMS_AI_SUBACCOUNT, sipServer: process.env.VOIPMS_SIP_SERVER };
  }

  async handleTranscript(organizationId: string, transcript: string) {
    return this.rag.chat({ organizationId, query: transcript, language: 'EN', contactHistory: [] });
  }
}
