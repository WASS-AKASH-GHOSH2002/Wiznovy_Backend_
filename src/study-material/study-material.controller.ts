import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, Put, UseInterceptors, UploadedFile, ParseFilePipe, UsePipes, ValidationPipe } from '@nestjs/common';
import { StudyMaterialService } from './study-material.service';
import { CreateStudyMaterialDto, UpdateStudyMaterialDto, StudyMaterialPaginationDto } from './dto/create-study-material.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PermissionAction, UserRole, FileSizeLimit } from 'src/enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomBytes } from 'node:crypto';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Account } from 'src/account/entities/account.entity';

@Controller('study-material')
export class StudyMaterialController {
  constructor(
    private readonly studyMaterialService: StudyMaterialService,
  ) { }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard, )
  @Roles(UserRole.TUTOR)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(
    FileInterceptor('pdf', {
      storage: diskStorage({
        destination: './uploads/StudyMaterial/pdfs',
        filename: (req, file, callback) => {
          const randomName = randomBytes(16).toString('hex');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: FileSizeLimit.DOCUMENT_SIZE,
      },
    }),
  )
  create(
    @Body() dto: CreateStudyMaterialDto,
    @UploadedFile() pdf?: Express.Multer.File
  ) {
    return this.studyMaterialService.create(dto, pdf);
  }


@Post('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard, )
  @Roles(UserRole.ADMIN, UserRole.STAFF)
 // @CheckPermissions([PermissionAction.CREATE, 'study_material'])
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(
    FileInterceptor('pdf', {
      storage: diskStorage({
        destination: './uploads/StudyMaterial/pdfs',
        filename: (req, file, callback) => {
          const randomName = randomBytes(16).toString('hex');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: FileSizeLimit.DOCUMENT_SIZE,
      },
    }),
  )
  admincreate(
    @Body() dto: CreateStudyMaterialDto,
    @UploadedFile() pdf?: Express.Multer.File
  ) {
    return this.studyMaterialService.create(dto, pdf);
  }


  @Get('list')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'study_material'])
  findAll(@Query() dto: StudyMaterialPaginationDto) {
    return this.studyMaterialService.findAll(dto);
  }


   @Get('tutor/list')
  @UseGuards(AuthGuard('jwt'), RolesGuard,)
  @Roles(UserRole.TUTOR)
  tutorfindAll(@Query() dto: StudyMaterialPaginationDto) {
    return this.studyMaterialService.findAll(dto);
  }
  @Get('user')
  @UseGuards(AuthGuard('jwt'))
  findByUser(@Query() dto: StudyMaterialPaginationDto, @CurrentUser() user?: Account) {
    return this.studyMaterialService.findByUser(dto, user?.id);
  }



  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studyMaterialService.findOne(id);
  }

  @Get('read/:id')
  @UseGuards(AuthGuard('jwt'))
  async downloadMaterial(@Param('id') id: string, @CurrentUser() user: any) {
    const material = await this.studyMaterialService.getStudyContent(id, user?.id);
    return material;
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'study_material'])
  update(@Param('id') id: string, @Body() dto: UpdateStudyMaterialDto) {
    return this.studyMaterialService.update(id, dto);
  }


   @Put('tutor/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.TUTOR)
  tutorUpdate(@Param('id') id: string, @Body() dto: UpdateStudyMaterialDto) {
    return this.studyMaterialService.update(id, dto);
  }
  @Put('pdf/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.TUTOR)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/StudyMaterial/pdfs',
        filename: (req, file, callback) => {
          const randomName = randomBytes(16).toString('hex');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: FileSizeLimit.DOCUMENT_SIZE,
      },
    }),
  )
  async pdf(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [],
      }),
    )
    file: Express.Multer.File,
  ) {
    const fileData = await this.studyMaterialService.findOne(id);
    return this.studyMaterialService.pdf(file.path, fileData);
  }

  @Put('admin/pdf/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'study_material'])
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/StudyMaterial/pdfs',
        filename: (req, file, callback) => {
          const randomName = randomBytes(16).toString('hex');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: FileSizeLimit.DOCUMENT_SIZE,
      },
    }),
  )
  async adminpdf(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [],
      }),
    )
    file: Express.Multer.File,
  ) {
    const fileData = await this.studyMaterialService.findOne(id);
    return this.studyMaterialService.pdf(file.path, fileData);
  }

  
  }




