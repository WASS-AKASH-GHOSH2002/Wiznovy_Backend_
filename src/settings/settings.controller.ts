import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PermissionAction, UserRole, FileSizeLimit } from 'src/enum';
import { SettingDto } from './dto/setting.dto';
import { SettingsService } from './settings.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

@Controller('settings')
export class SettingsController {
  version = new Date();
  
  private static getStorageConfig() {
    return {
      storage: diskStorage({
        destination: './uploads/settings',
        filename: (req, file, callback) => {
          const randomName = randomBytes(16).toString('hex');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: FileSizeLimit.LOGO_SIZE,
        files: 1,
        fields: 5
      },
    };
  }

  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  find() {
    return this.settingsService.find();
  }

  @Get('admin')
  findSettingByAdmin() {
    return this.settingsService.findSettingByAdmin();
  }

  @Patch('update')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'setting'])
  update(@Body() dto: SettingDto) {
    return this.settingsService.update(dto);
  }

  @Put('logo')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'setting'])
  @UseInterceptors(FileInterceptor('file', SettingsController.getStorageConfig()))
  async logo(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
          new MaxFileSizeValidator({ maxSize: FileSizeLimit.LOGO_SIZE }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const fileData = await this.settingsService.findSetting();
    return this.settingsService.logo(file.path, fileData);
  }
}
