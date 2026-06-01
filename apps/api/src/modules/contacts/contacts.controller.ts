import { Body, Controller, ForbiddenException, Get, Headers, NotFoundException, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContactsService } from './contacts.service';

const PLATFORM_ROLES = new Set(['SUPER_ADMIN', 'OPS_MANAGER']);

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contacts: ContactsService, private readonly prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.prisma.contact.findMany({ where: this.contactScope(request.user), include: { customer: true, assignedAgent: true }, orderBy: { createdAt: 'desc' } });
  }

  @UseGuards(JwtAuthGuard)
  @Get('queue')
  queue(@Req() request: AuthenticatedRequest) {
    return this.prisma.contact.findMany({ where: { ...this.contactScope(request.user), status: { in: ['QUEUED', 'ESCALATED'] } }, orderBy: { startedAt: 'asc' } });
  }

  @Get('widget/:embedKey/config')
  widgetConfig(@Param('embedKey') embedKey: string, @Headers('origin') origin?: string, @Headers('referer') referer?: string) {
    return this.contacts.getWidgetConfig(embedKey, { origin, referer });
  }

  @Post('widget/:embedKey')
  startWidget(
    @Param('embedKey') embedKey: string,
    @Body() body: { name?: string; email?: string; language?: 'EN' | 'FR'; pipedaConsent: boolean },
    @Headers('origin') origin?: string,
    @Headers('referer') referer?: string,
  ) {
    return this.contacts.startWidgetContact(embedKey, body, { origin, referer });
  }

  @Post('widget/:contactId/message')
  widgetMessage(@Param('contactId') contactId: string, @Body() body: { content: string }) {
    return this.contacts.receiveWidgetMessage(contactId, body.content);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/assign')
  async assign(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: { assignedAgentId: string }) {
    const contact = await this.prisma.contact.findFirst({ where: { id, ...this.contactScope(request.user) }, select: { organizationId: true } });
    if (!contact) throw new NotFoundException('Contact not found');
    const agent = await this.prisma.user.findFirst({ where: { id: body.assignedAgentId, OR: [{ organizationId: contact.organizationId }, { clientAssignments: { some: { organizationId: contact.organizationId } } }] }, select: { id: true } });
    if (!agent) throw new ForbiddenException('Assigned agent does not belong to this organization');
    return this.prisma.contact.update({ where: { id }, data: { assignedAgentId: body.assignedAgentId, status: 'ASSIGNED' } });
  }

  private contactScope(user: AuthenticatedRequest['user']) {
    if (PLATFORM_ROLES.has(user.role)) return {};
    if (!user.organizationId) throw new ForbiddenException('User is not assigned to an organization');
    return { organizationId: user.organizationId };
  }
}
