import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateClientSettingsDto, UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  private assertOrgAccess(id: string, callerOrgId?: string) {
    if (callerOrgId && id !== callerOrgId) throw new ForbiddenException();
  }

  async getOrg(id: string, callerOrgId?: string) {
    this.assertOrgAccess(id, callerOrgId);
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async updateOrg(id: string, dto: UpdateOrganizationDto, callerOrgId?: string) {
    this.assertOrgAccess(id, callerOrgId);
    return this.prisma.organization.update({ where: { id }, data: dto });
  }

  getSettings(organizationId: string, callerOrgId?: string) {
    this.assertOrgAccess(organizationId, callerOrgId);
    return this.prisma.clientSettings.findUnique({ where: { organizationId } });
  }

  updateSettings(organizationId: string, dto: UpdateClientSettingsDto, callerOrgId?: string) {
    this.assertOrgAccess(organizationId, callerOrgId);
    return this.prisma.clientSettings.upsert({
      where: { organizationId },
      update: dto,
      create: {
        organizationId,
        ...dto
      }
    });
  }
}
