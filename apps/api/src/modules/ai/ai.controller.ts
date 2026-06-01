import { Body, Controller, Param, Post } from '@nestjs/common';
import { Language } from '@prisma/client';
import { RagService } from './rag.service';
import { SuggestService } from './suggest.service';

@Controller('ai')
export class AiController {
  constructor(private readonly rag: RagService, private readonly suggest: SuggestService) {}

  @Post('voice/:orgId')
  voice(@Param('orgId') organizationId: string, @Body() body: { query: string; language?: Language }) {
    return this.rag.chat({ organizationId, query: body.query, language: body.language ?? 'EN', contactHistory: [] });
  }

  @Post('suggest-reply/:contactId')
  suggestReply(@Param('contactId') contactId: string) {
    return this.suggest.suggestReply(contactId);
  }
}
