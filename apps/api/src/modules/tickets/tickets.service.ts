import { Injectable } from '@nestjs/common';
import { TicketPriority, TicketStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: { organizationId: string; subject: string; description: string; priority: TicketPriority; createdById: string; customerId?: string; contactId?: string }) {
    const org = await this.prisma.organization.findUniqueOrThrow({ where: { id: input.organizationId }, include: { slaConfig: true } });
    const count = await this.prisma.ticket.count({ where: { organizationId: input.organizationId } });
    const ticketNumber = `TKT-${org.slug}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;
    const dueAt = this.calculateDueAt(input.priority, org.slaConfig ?? undefined);
    return this.prisma.ticket.create({ data: { ...input, ticketNumber, dueAt } });
  }

  calculateDueAt(priority: TicketPriority, sla?: { lowHours: number; mediumHours: number; highHours: number; urgentHours: number }): Date {
    const hours = priority === 'URGENT' ? (sla?.urgentHours ?? 2) : priority === 'HIGH' ? (sla?.highHours ?? 8) : priority === 'LOW' ? (sla?.lowHours ?? 72) : (sla?.mediumHours ?? 24);
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  updateStatus(id: string, status: TicketStatus) {
    const now = new Date();
    return this.prisma.ticket.update({ where: { id }, data: { status, resolvedAt: status === 'RESOLVED' ? now : undefined, closedAt: status === 'CLOSED' ? now : undefined } });
  }
}
