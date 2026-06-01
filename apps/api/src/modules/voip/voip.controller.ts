import { Controller, Get, Param, Post } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Controller('voip')
export class VoipController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('did-status')
  didStatus() { return { sipServer: process.env.VOIPMS_SIP_SERVER ?? 'toronto.voip.ms', aiBridge: process.env.VOIPMS_AI_SUBACCOUNT, status: 'configured' }; }

  @Get('call-records')
  callRecords() { return this.prisma.callRecord.findMany({ orderBy: { createdAt: 'desc' } }); }

  @Post('call-records/:id/retry-transcription')
  retry(@Param('id') id: string) { return this.prisma.callRecord.update({ where: { id }, data: { transcriptionStatus: 'QUEUED', transcriptionError: null } }); }
}
