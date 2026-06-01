import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Language } from '@prisma/client';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RagService } from './rag.service';
import { SuggestService } from './suggest.service';

@Controller('ai')
export class AiController {
  constructor(private readonly rag: RagService, private readonly suggest: SuggestService) {}

  @UseGuards(JwtAuthGuard, TenantGuard)
  @Post('voice/:organizationId')
  voice(@Param('organizationId') organizationId: string, @Body() body: { query: string; language?: Language }) {
    return this.rag.chat({ organizationId, query: body.query, language: body.language ?? 'EN', contactHistory: [] });
  }

  @UseGuards(JwtAuthGuard)
  @Post('suggest-reply/:contactId')
  suggestReply(@Req() request: AuthenticatedRequest, @Param('contactId') contactId: string) {
    return this.suggest.suggestReply(contactId, request.user);
  }
}
