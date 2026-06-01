import { Body, Controller, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ContactsService } from './contacts.service';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contacts: ContactsService, private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.contact.findMany({ include: { customer: true, assignedAgent: true }, orderBy: { createdAt: 'desc' } });
  }

  @Get('queue')
  queue() {
    return this.prisma.contact.findMany({ where: { status: { in: ['QUEUED', 'ESCALATED'] } }, orderBy: { startedAt: 'asc' } });
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

  @Patch(':id/assign')
  assign(@Param('id') id: string, @Body() body: { assignedAgentId: string }) {
    return this.prisma.contact.update({ where: { id }, data: { assignedAgentId: body.assignedAgentId, status: 'ASSIGNED' } });
  }
}
