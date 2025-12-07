import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Put, UploadedFile, UseInterceptors, ParseFilePipe } from '@nestjs/common';
import { ClassService } from './class.service';
import { CreateClassDto, ClassPaginationDto, UpdateStatusDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PermissionAction, UserRole, FileSizeLimit } from 'src/enum';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('class')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
   @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
    @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'class'])
  create(@Body() createClassDto: CreateClassDto) {
    return this.classService.create(createClassDto);
  }

  @Get('list')
    @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
    @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'class'])
  findAll(@Query() dto:ClassPaginationDto) {
    return this.classService.findAll(dto);
  }

  @Get('all')
  findByUser() {
    return this.classService.findByUser();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'class'])
  findOne(@Param('id') id: string) {
    return this.classService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'class'])
  update(@Param('id') id: string, @Body() updateClassDto: UpdateClassDto) {
    return this.classService.update(id, updateClassDto);
  }

  @Put('status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'class'])
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.classService.updateStatus(id, dto);
  }

  @Put('update/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'class'])
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/Classes',
        filename: (req, file, callback) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: FileSizeLimit.IMAGE_SIZE,
      },
    }),
  )
  async image(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [],
      }),
    )
    file: Express.Multer.File,
  ) {
    const fileData = await this.classService.findOne(id);
    return this.classService.image(file.path, fileData);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.DELETE, 'class'])
  remove(@Param('id') id: string) {
    return this.classService.remove(id);
  }
}
