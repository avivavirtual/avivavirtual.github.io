import { Controller, Get, NotFoundException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';

const PLATFORM_ROLES = new Set(['SUPER_ADMIN', 'OPS_MANAGER']);

@Controller('voip')
@UseGuards(JwtAuthGuard, TenantGuard)
export class VoipController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('did-status')
  didStatus() { return { sipServer: process.env.VOIPMS_SIP_SERVER ?? 'toronto.voip.ms', aiBridge: process.env.VOIPMS_AI_SUBACCOUNT, status: 'configured' }; }

  @Get('call-records')
  callRecords(@Req() request: AuthenticatedRequest) {
    return this.prisma.callRecord.findMany({ where: this.callRecordScope(request.user), orderBy: { createdAt: 'desc' } });
  }

  @Post('call-records/:id/retry-transcription')
  async retry(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    const record = await this.prisma.callRecord.findFirst({ where: { id, ...this.callRecordScope(request.user) }, select: { id: true } });
    if (!record) throw new NotFoundException('Call record not found');
    return this.prisma.callRecord.update({ where: { id }, data: { transcriptionStatus: 'QUEUED', transcriptionError: null } });
  }

  private callRecordScope(user: AuthenticatedRequest['user']) {
    return PLATFORM_ROLES.has(user.role) ? {} : { organizationId: user.organizationId ?? '__unauthorized__' };
  }
}
