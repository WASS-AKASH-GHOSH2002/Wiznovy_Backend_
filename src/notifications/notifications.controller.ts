import {
  Body,
  Controller,
  Delete,
  Get,
  NotAcceptableException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Account } from 'src/account/entities/account.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PermissionAction, UserRole } from 'src/enum';
import { NotificationDto, NotificationFilterDto } from './dto/notification.dto';
import { NotificationsService } from './notifications.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('bulk')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'notification'])
  async bulk(@Body() body: NotificationDto) {
    const res = await this.notificationsService.sendBulkNotification(
      body.desc,
      body.title,
      '/topics/all',
      false,
    );
    if (res?.success == 1) {
      return this.notificationsService.create({
        title: body.title,
        desc: body.desc,
        type: body.type,
        accountId: null,
      });
    } else {
      throw new NotAcceptableException('Try after some time!');
    }
  }

  @Post('single')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'notification'])
  async single(@Body() body: NotificationDto) {
    return this.notificationsService.create({
      title: body.title,
      desc: body.desc,
      type: body.type,
      accountId: body.accountId,
    });
  }

  @Post('multi')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'notification'])
  async multi(@Body() body: NotificationDto) {
    const res = await this.notificationsService.sendBulkNotification(
      body.desc,
      body.title,
      body.deviceId,
      true,
    );
    if (res?.success == 1) {
      for (const i in body.accountId) {
        await this.notificationsService.create({
          title: body.title,
          desc: body.desc,
          type: body.type,
          accountId: body.accountId[i],
        });
      }
      return 'Success';
    } else {
      throw new NotAcceptableException('Try after some time!');
    }
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @Roles(UserRole.USER,UserRole.TUTOR)
  findAll(@Query() query, @CurrentUser() user: Account) {
    const limit = query.limit || 10;
    const offset = query.offset || 0;
    return this.notificationsService.findAll(limit, offset, user.id);
  }

  @Get('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'notification'])
  getAdminNotifications(@Query() dto: NotificationFilterDto, @CurrentUser() user: Account) {
    return this.notificationsService.getAdminNotifications(user.id, {
      limit: dto.limit || 10,
      offset: dto.offset || 0,
      fromDate: dto.fromDate,
      toDate: dto.toDate,
      read: dto.read,
    });
  }

  @Get('list')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'notification'])
  find(@Query() query) {
    const limit = query.limit || 10;
    const offset = query.offset || 0;
    return this.notificationsService.find(limit, offset);
  }

  @Patch('mark-all-read')
  @UseGuards(AuthGuard('jwt'))
  markAllAsRead(@CurrentUser() user: Account) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Get('unread-count')
  @UseGuards(AuthGuard('jwt'))
  getUnreadCount(@CurrentUser() user: Account) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Param('id') id: string, @CurrentUser() user: Account) {
    const numId = Number.parseInt(id, 10);
    if (Number.isNaN(numId)) throw new NotAcceptableException('Invalid notification id');
    return this.notificationsService.findOne(numId, user.id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(
    @Param('id') id: string,
    @Body('status') status: boolean,
    @CurrentUser() user: Account,
  ) {
    const numId = Number.parseInt(id, 10);
    if (Number.isNaN(numId)) throw new NotAcceptableException('Invalid notification id');
    return this.notificationsService.update(numId, user.id, status);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  deleteNotification(@Param('id') id: string, @CurrentUser() user: Account) {
    const numId = Number.parseInt(id, 10);
    if (Number.isNaN(numId)) throw new NotAcceptableException('Invalid notification id');
    return this.notificationsService.deleteNotification(numId, user.id);
  }
  @Get('real-time')
  @UseGuards(AuthGuard('jwt'))
  @Roles(UserRole.USER)
  getRealTimeNotifications(@CurrentUser() user: Account, @Query('lastCheck') lastCheck?: string) {
    const since = lastCheck ? new Date(lastCheck) : new Date(Date.now() - 5 * 60 * 1000);
    return this.notificationsService.getNotificationsSince(user.id, since);
  }
}
