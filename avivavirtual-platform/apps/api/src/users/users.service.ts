import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserStatusType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateAgentStatusDto, UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  listByOrg(organizationId: string) {
    return this.prisma.user.findMany({ where: { organizationId, status: { not: UserStatusType.SUSPENDED } } });
  }

  async getById(id: string, organizationId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (organizationId && user.organizationId !== organizationId) throw new ForbiddenException();
    return user;
  }

  async update(id: string, dto: UpdateUserDto, organizationId: string) {
    await this.getById(id, organizationId);
    return this.prisma.user.update({ where: { id }, data: dto });
  }

  async softDelete(id: string, organizationId: string) {
    await this.getById(id, organizationId);
    return this.prisma.user.update({ where: { id }, data: { status: UserStatusType.SUSPENDED } });
  }

  async updateStatus(id: string, dto: UpdateAgentStatusDto, organizationId: string) {
    await this.getById(id, organizationId);
    return this.prisma.agentStatus.upsert({
      where: { agentId: id },
      update: { status: dto.status },
      create: { agentId: id, status: dto.status }
    });
  }
}
