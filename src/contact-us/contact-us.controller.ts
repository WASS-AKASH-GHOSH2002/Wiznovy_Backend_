import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CommonPaginationDto } from 'src/common/dto/common-pagination.dto';
import { PermissionAction, UserRole } from 'src/enum';
import { ContactUsService } from './contact-us.service';
import { CreateContactUsDto } from './dto/create-contact-us.dto';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Account } from 'src/account/entities/account.entity';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

@Controller('contact-us')
export class ContactUsController {
  constructor(private readonly contactUsService: ContactUsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.USER)
  create(@Body() dto: CreateContactUsDto, @CurrentUser() user: Account) {
    dto.accountId = user.id;
    return this.contactUsService.create(dto);
  }

  @Get('all')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'contact_us'])
  findAll(@Query() dto: CommonPaginationDto) {
    return this.contactUsService.findAll(dto);
  }
}
