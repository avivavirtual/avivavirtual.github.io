import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { TicketPriority, TicketStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly tickets: TicketsService, private readonly prisma: PrismaService) {}

  @Get()
  list() { return this.prisma.ticket.findMany({ include: { customer: true, assignedAgent: true }, orderBy: { createdAt: 'desc' } }); }

  @Post()
  create(@Body() body: { organizationId: string; subject: string; description: string; priority: TicketPriority; createdById: string; customerId?: string; contactId?: string }) { return this.tickets.create(body); }

  @Patch(':id/status')
  status(@Param('id') id: string, @Body() body: { status: TicketStatus }) { return this.tickets.updateStatus(id, body.status); }
}
