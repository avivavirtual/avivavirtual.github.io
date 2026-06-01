import { Body, Controller, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { TicketPriority, TicketStatus } from '@prisma/client';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TicketsService } from './tickets.service';

const PLATFORM_ROLES = new Set(['SUPER_ADMIN', 'OPS_MANAGER']);

@Controller('tickets')
@UseGuards(JwtAuthGuard, TenantGuard)
export class TicketsController {
  constructor(private readonly tickets: TicketsService, private readonly prisma: PrismaService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    const where = this.ticketScope(request.user);
    return this.prisma.ticket.findMany({ where, include: { customer: true, assignedAgent: true }, orderBy: { createdAt: 'desc' } });
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() body: { organizationId?: string; subject: string; description: string; priority: TicketPriority; customerId?: string; contactId?: string; assignedAgentId?: string },
  ) {
    const organizationId = this.resolveWritableOrganization(request.user, body.organizationId);
    return this.tickets.create({ ...body, organizationId, createdById: request.user.sub });
  }

  @Patch(':id/status')
  async status(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: { status: TicketStatus }) {
    await this.assertTicketVisible(request, id);
    return this.tickets.updateStatus(id, body.status);
  }

  private ticketScope(user: AuthenticatedRequest['user']) {
    return PLATFORM_ROLES.has(user.role) ? {} : { organizationId: this.requireUserOrganization(user) };
  }

  private resolveWritableOrganization(user: AuthenticatedRequest['user'], requestedOrganizationId?: string) {
    if (PLATFORM_ROLES.has(user.role)) {
      if (!requestedOrganizationId) throw new ForbiddenException('organizationId is required for platform ticket creation');
      return requestedOrganizationId;
    }
    const organizationId = this.requireUserOrganization(user);
    if (requestedOrganizationId && requestedOrganizationId !== organizationId) throw new ForbiddenException('Cross-tenant ticket creation denied');
    return organizationId;
  }

  private requireUserOrganization(user: AuthenticatedRequest['user']) {
    if (!user.organizationId) throw new ForbiddenException('User is not assigned to an organization');
    return user.organizationId;
  }

  private async assertTicketVisible(request: AuthenticatedRequest, id: string) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id, ...this.ticketScope(request.user) }, select: { id: true } });
    if (!ticket) throw new NotFoundException('Ticket not found');
  }
}
