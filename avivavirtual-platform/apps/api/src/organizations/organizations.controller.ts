import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';

import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpdateClientSettingsDto, UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get(':id')
  getOrg(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.organizationsService.getOrg(id, user.organizationId);
  }

  @Patch(':id')
  @Roles(Role.CLIENT_ADMIN, Role.SUPER_ADMIN)
  updateOrg(@Param('id') id: string, @Body() dto: UpdateOrganizationDto, @CurrentUser() user: JwtUser) {
    return this.organizationsService.updateOrg(id, dto, user.organizationId);
  }

  @Get(':id/settings')
  getSettings(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.organizationsService.getSettings(id, user.organizationId);
  }

  @Patch(':id/settings')
  @Roles(Role.CLIENT_ADMIN, Role.SUPER_ADMIN)
  updateSettings(@Param('id') id: string, @Body() dto: UpdateClientSettingsDto, @CurrentUser() user: JwtUser) {
    return this.organizationsService.updateSettings(id, dto, user.organizationId);
  }
}
