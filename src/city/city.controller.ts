import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CityService } from './city.service';
import { CreateCityDto, UpdateCityDto, CityPaginationDto, CityStatusDto, BulkCityStatusDto } from './dto/create-city.dto';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionAction, UserRole } from 'src/enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AdminProtected } from 'src/admin-action-log/decorators/admin-protected.decorator';

@Controller('city')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @AdminProtected()
  @CheckPermissions([PermissionAction.CREATE, 'city'])
  create(@Body() createCityDto: CreateCityDto) {
    return this.cityService.create(createCityDto);
  }

  @Get('list')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'city'])
  findAll(@Query() dto: CityPaginationDto) {
    return this.cityService.findAll(dto);
  }

  @Get('user')
  findByUser(@Query('stateId') stateId?: string) {
    return this.cityService.findByUser(stateId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'city'])
  findOne(@Param('id') id: string) {
    return this.cityService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @AdminProtected()
  @CheckPermissions([PermissionAction.UPDATE, 'city'])
  update(@Param('id') id: string, @Body() updateCityDto: UpdateCityDto) {
    return this.cityService.update(+id, updateCityDto);
  }

  @Put('status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @AdminProtected()
  @CheckPermissions([PermissionAction.UPDATE, 'city'])
  updateStatus(@Param('id') id: string, @Body() dto: CityStatusDto) {
    return this.cityService.updateStatus(+id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @AdminProtected()
  @CheckPermissions([PermissionAction.DELETE, 'city'])
  remove(@Param('id') id: string) {
    return this.cityService.remove(+id);
  }

  @Put('bulk-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @AdminProtected()
  @CheckPermissions([PermissionAction.UPDATE, 'city'])
  bulkUpdateStatus(@Body() dto: BulkCityStatusDto) {
    return this.cityService.bulkUpdateStatus(dto);
  }
}
