import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Role, TicketPriority, TicketStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

const MAX_TICKET_CREATE_ATTEMPTS = 3;

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: { organizationId: string; subject: string; description: string; priority: TicketPriority; createdById: string; customerId?: string; contactId?: string; assignedAgentId?: string }) {
    for (let attempt = 1; attempt <= MAX_TICKET_CREATE_ATTEMPTS; attempt += 1) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const org = await tx.organization.findUniqueOrThrow({ where: { id: input.organizationId }, include: { slaConfig: true } });
          await this.assertTenantReferences(tx, input);
          const count = await tx.ticket.count({ where: { organizationId: input.organizationId } });
          const ticketNumber = this.formatTicketNumber(org.slug, new Date(), count + 1);
          const dueAt = this.calculateDueAt(input.priority, org.slaConfig ?? undefined);
          return tx.ticket.create({ data: { ...input, ticketNumber, dueAt } });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        if (this.isRetryableTicketCreateError(error) && attempt < MAX_TICKET_CREATE_ATTEMPTS) continue;
        throw error;
      }
    }
    throw new BadRequestException('Unable to create ticket number after retries');
  }

  private async assertTenantReferences(tx: Prisma.TransactionClient, input: { organizationId: string; createdById: string; customerId?: string; contactId?: string; assignedAgentId?: string }) {
    const [creator, customer, contact, assignedAgent] = await Promise.all([
      tx.user.findFirst({ where: { id: input.createdById, OR: [{ organizationId: input.organizationId }, { role: { in: [Role.SUPER_ADMIN, Role.OPS_MANAGER] } }] }, select: { id: true } }),
      input.customerId ? tx.customer.findFirst({ where: { id: input.customerId, organizationId: input.organizationId }, select: { id: true } }) : Promise.resolve({ id: undefined }),
      input.contactId ? tx.contact.findFirst({ where: { id: input.contactId, organizationId: input.organizationId }, select: { id: true } }) : Promise.resolve({ id: undefined }),
      input.assignedAgentId ? tx.user.findFirst({ where: { id: input.assignedAgentId, OR: [{ organizationId: input.organizationId }, { clientAssignments: { some: { organizationId: input.organizationId } } }] }, select: { id: true } }) : Promise.resolve({ id: undefined }),
    ]);
    if (!creator) throw new BadRequestException('Ticket creator is not permitted for this organization');
    if (input.customerId && !customer) throw new BadRequestException('Customer does not belong to this organization');
    if (input.contactId && !contact) throw new BadRequestException('Contact does not belong to this organization');
    if (input.assignedAgentId && !assignedAgent) throw new BadRequestException('Assigned agent does not belong to this organization');
  }

  private isRetryableTicketCreateError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2034'].includes(error.code);
  }

  private formatTicketNumber(slug: string, date: Date, sequence: number) {
    return `TKT-${slug}-${date.toISOString().slice(0, 10).replace(/-/g, '')}-${String(sequence).padStart(4, '0')}`;
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
