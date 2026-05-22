import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';

import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpdateAgentStatusDto, UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.CLIENT_ADMIN, Role.SUPER_ADMIN)
  list(@CurrentUser() user: JwtUser) {
    return this.usersService.listByOrg(user.organizationId!);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.usersService.getById(id, user.organizationId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: JwtUser) {
    return this.usersService.update(id, dto, user.organizationId!);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.usersService.softDelete(id, user.organizationId!);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAgentStatusDto, @CurrentUser() user: JwtUser) {
    return this.usersService.updateStatus(id, dto, user.organizationId!);
  }
}
