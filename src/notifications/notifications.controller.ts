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
import { NotificationDto } from './dto/notification.dto';
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
  @Roles(UserRole.USER)
  findAll(@Query() query, @CurrentUser() user: Account) {
    const limit = query.limit || 10;
    const offset = query.offset || 0;
    return this.notificationsService.findAll(limit, offset, user.id);
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

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(
    @Param('id') id: string,
    @Body('status') status: boolean,
    @CurrentUser() user: Account,
  ) {
    return this.notificationsService.update(+id, user.id, status);
  }

  @Patch('mark-all-read')
  @UseGuards(AuthGuard('jwt'))
  @Roles(UserRole.USER)
  markAllAsRead(@CurrentUser() user: Account) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Get('unread-count')
  @UseGuards(AuthGuard('jwt'))
  @Roles(UserRole.USER)
  getUnreadCount(@CurrentUser() user: Account) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @Roles(UserRole.USER)
  deleteNotification(@Param('id') id: string, @CurrentUser() user: Account) {
    return this.notificationsService.deleteNotification(+id, user.id);
  }



  @Get('real-time')
  @UseGuards(AuthGuard('jwt'))
  @Roles(UserRole.USER)
  getRealTimeNotifications(@CurrentUser() user: Account, @Query('lastCheck') lastCheck?: string) {
    const since = lastCheck ? new Date(lastCheck) : new Date(Date.now() - 5 * 60 * 1000);
    return this.notificationsService.getNotificationsSince(user.id, since);
  }
}
