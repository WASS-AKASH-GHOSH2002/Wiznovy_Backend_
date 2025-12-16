import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, Put, UseInterceptors, UploadedFile, UploadedFiles, ParseFilePipe, UsePipes, ValidationPipe } from '@nestjs/common';
import { UnitService } from './unit.service';
import { CreateUnitDto, UpdateUnitDto, UnitPaginationDto } from './dto/create-unit.dto';
import { AddContentToUnitDto } from './dto/unit-content.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PermissionAction, UserRole, FileSizeLimit } from 'src/enum';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

@Controller('unit')
export class UnitController {
  private static getStorageConfig() {
    return {
      storage: diskStorage({
        destination: './uploads/UnitImg',
        filename: (req, file, callback) => {
          const randomName = randomBytes(16).toString('hex');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: FileSizeLimit.IMAGE_SIZE,
      },
    };
  }

  constructor(private readonly unitService: UnitService) { }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 }
    ], UnitController.getStorageConfig())
  )
  create(
    @Body() dto: CreateUnitDto,
    @UploadedFiles() files?: { image?: Express.Multer.File[] }
  ) {
    return this.unitService.create(dto, files?.image?.[0]?.path);
  }

  @Post('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF,UserRole.TUTOR)
  //@CheckPermissions([PermissionAction.CREATE, 'unit'])
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 }
    ], UnitController.getStorageConfig())
  )
  admincreate(
    @Body() dto: CreateUnitDto,
    @UploadedFiles() files?: { image?: Express.Multer.File[] }
  ) {
    return this.unitService.create(dto, files?.image?.[0]?.path);
  }


  @Get('list')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'unit'])
  findAll(@Query() dto: UnitPaginationDto) {
    return this.unitService.findAll(dto);
  }

  @Get('by-course')
  @UseGuards(AuthGuard('jwt'),RolesGuard)
  @Roles(UserRole.TUTOR)
  getUnitsByCourse(@Query() dto: UnitPaginationDto) {
    return this.unitService.getUnitsByCourse(dto);
  }

  @Get('admin/by-course') 
   @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  unitsByCourse(@Query() dto: UnitPaginationDto) {
    return this.unitService.getUnitsByCourse(dto);
  }

  @Get('user')
   @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.USER)
  findByUser(@Query() dto: UnitPaginationDto) {
    return this.unitService.findByUser(dto);
  }



  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.unitService.findOne(id, user?.id);
  }

  @Get(':id/public')
  findOnePublic(@Param('id') id: string) {
    return this.unitService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard,)
  @Roles(UserRole.TUTOR)
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.unitService.update(id, dto);
  }

    @Put('admin/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard,PermissionsGuard )
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'unit'])
  adminupdate(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.unitService.update(id, dto);
  }

  @Put('imge/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, )
  @Roles(UserRole.TUTOR)
  @UseInterceptors(FileInterceptor('file', UnitController.getStorageConfig()))
  async image(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
          // new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 1 }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const unit = await this.unitService.findOne(id);
    return this.unitService.image(file.path, unit);
  }
  @Put('admin/imge/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'unit'])
  @UseInterceptors(FileInterceptor('file', UnitController.getStorageConfig()))
  async adminimage(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
          // new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 1 }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const unit = await this.unitService.findOne(id);
    return this.unitService.image(file.path, unit);
  }


  

  @Put('status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF,UserRole.TUTOR)
 // @CheckPermissions([PermissionAction.UPDATE, 'unit'])
  status(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.unitService.status(id, dto);
  }
}