import { BadRequestException, Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PermissionAction, UserRole } from 'src/enum';
import { UpdatePermissionDto } from './dto/permission.dto';
import { UserPermissionsService } from './user-permissions.service';
import { BoolStatusDto } from 'src/common/dto/bool-status.dto';

@Controller('user-permissions')
export class UserPermissionsController {
  constructor(
    private readonly userPermissionsService: UserPermissionsService,
  ) {}

  @Get(':menuId/:accountId')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(...Object.values(UserRole))
  @CheckPermissions([PermissionAction.READ, 'user_permission'])
  async getPermission(@Param('menuId') menuId: string, @Param('accountId') accountId: string) {
    return this.userPermissionsService.getPermission(menuId, accountId);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(...Object.values(UserRole))
  @CheckPermissions([PermissionAction.UPDATE, 'user_permission'])
  async update(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    const obj = [];
    dto.menu.forEach((menuItem) => {
      menuItem.userPermission.forEach((permItem) => {
        obj.push({
          id: permItem.id,
          rootAccountId: permItem.accountId,
          menuId: menuItem.id,
          permissionId: permItem.permission.id,
          status: permItem.status,
        });
      });
    });
    this.userPermissionsService.create(obj);
    return { menu: dto.menu };
  }

  @Put('status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(...Object.values(UserRole))
  @CheckPermissions([PermissionAction.UPDATE, 'user_permission'])
  async status(@Param('id') id: string, @Body() dto: BoolStatusDto) {
    if (!id || Number.isNaN(+id)) {
      throw new BadRequestException('Valid ID is required');
    }
    return this.userPermissionsService.status(+id, dto);
  }
}
