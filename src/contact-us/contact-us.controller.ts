import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PermissionAction, UserRole } from 'src/enum';
import { ContactUsService } from './contact-us.service';
import { ContactUsStatusDto, CreateContactUsDto, ContactUsPaginationDto } from './dto/create-contact-us.dto';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { AdminProtected } from 'src/admin-action-log/decorators/admin-protected.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('contact-us')
@ApiBearerAuth('JWT-auth')
@Controller('contact-us')
export class ContactUsController {
  constructor(private readonly contactUsService: ContactUsService) {}

  @Post()
  create(@Body() dto: CreateContactUsDto, ) {
    return this.contactUsService.create(dto);
  }

  @Get('all')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'contact_us'])
  findAll(@Query() dto: ContactUsPaginationDto) {
    return this.contactUsService.findAll(dto);
  }

  @Put('status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'contact_us'])
  @ApiOperation({ summary: 'Update contact us status' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: ContactUsStatusDto })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 404, description: 'Contact us entry not found' })
  updateStatus(@Param('id') id: string, @Body() dto: ContactUsStatusDto) {
    return this.contactUsService.updateStatus(id, dto);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'contact_us'])
  findOne(@Param('id') id: string) {
    return this.contactUsService.findOne(id);
  }
}
