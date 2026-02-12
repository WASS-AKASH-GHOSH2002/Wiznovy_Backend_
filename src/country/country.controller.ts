import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Put, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator } from '@nestjs/common';
import { CountryService } from './country.service';
import { BulkCountryStatusDto, CountryPaginationDto, CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PermissionAction, UserRole, FileSizeLimit } from 'src/enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { GoalStatusDto } from 'src/goal/dto/create-goal.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { randomBytes } from 'node:crypto';

@Controller('country')
export class CountryController {
  private static getStorageConfig() {
    return {
      storage: diskStorage({
        destination: './uploads/Country/images',
        filename: (req, file, callback) => {
          const randomName = randomBytes(16).toString('hex');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: FileSizeLimit.IMAGE_SIZE,
        files: 1,
        fields: 10,
        fieldNameSize: 100,
        fieldSize: 2097152,
        parts: 12
      },
    };
  }

  constructor(private readonly countryService: CountryService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'country'])
  create(@Body() dto: CreateCountryDto) {
    return this.countryService.create(dto);
  }

  @Get('list')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'country'])
  findAll(@Query() dto: CountryPaginationDto) {
    return this.countryService.findAll(dto);
  }

  @Get('all')
  findByUser() {
    return this.countryService.findByUser();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'country'])
  findOne(@Param('id') id: string) {
    return this.countryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'country'])
  update(@Param('id') id: string, @Body() dto:UpdateCountryDto) {
    return this.countryService.update(id, dto);
  }

  @Put('status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'country'])
  updateStatus(@Param('id') id: string, @Body() dto: GoalStatusDto) {
    return this.countryService.updateStatus(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.DELETE, 'country'])
  remove(@Param('id') id: string) {
    return this.countryService.remove(id);
  }

  @Put('bulk-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'country'])
  bulkUpdateStatus(@Body() dto: BulkCountryStatusDto) {
    return this.countryService.bulkUpdateStatus(dto);
  }

  
  @Put('image/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'country'])
  @UseInterceptors(FileInterceptor('file', CountryController.getStorageConfig()))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: FileSizeLimit.IMAGE_SIZE }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const country = await this.countryService.findOne(id);
    return this.countryService.uploadImage(file.path, country);
  }
}

