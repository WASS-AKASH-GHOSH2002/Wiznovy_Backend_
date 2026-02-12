import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { DefaultStatusDto } from 'src/common/dto/default-status.dto';
import { PermissionAction, UserRole } from 'src/enum';
import { FaqDto,  FaqPaginationDto,  UpdateFaqDto, BulkFaqStatusDto } from './dto/faq.dto';
import { FaqsService } from './faqs.service';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

@Controller('faqs')
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  @Get('all')
  find() {
    return this.faqsService.find();
  }

  @Get('user')
  findUserFaqs() {
    return this.faqsService.findByType('USER');
  }

  @Get('tutor')
  findTutorFaqs() {
    return this.faqsService.findByType('TUTOR');
  }

  @Get('list')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'faq'])
  findAll(@Query() dto:FaqPaginationDto) {
    return this.faqsService.findAll(dto);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'faq'])
  create(@Body() dto: FaqDto) {
    return this.faqsService.create(dto);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'faq'])
  findOne(@Param('id') id: string) {
    return this.faqsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'faq'])
  update(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    return this.faqsService.update(id, dto);
  }

  @Put('status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'faq'])
  status(@Param('id') id: string, @Body() dto: DefaultStatusDto) {
    return this.faqsService.status(id, dto);
  }

  @Put('bulk-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'faq'])
  bulkUpdateStatus(@Body() dto: BulkFaqStatusDto) {
    return this.faqsService.bulkUpdateStatus(dto);
  }
}
