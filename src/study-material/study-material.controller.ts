import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, UseInterceptors, UploadedFile, ParseFilePipe, UsePipes, ValidationPipe, UploadedFiles } from '@nestjs/common';
import { StudyMaterialService } from './study-material.service';
import { CreateStudyMaterialDto, UpdateStudyMaterialDto, StudyMaterialPaginationDto } from './dto/create-study-material.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PermissionAction, UserRole, FileSizeLimit } from 'src/enum';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Account } from 'src/account/entities/account.entity';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { randomBytes } from 'node:crypto';

@Controller('study-material')
export class StudyMaterialController {
  constructor(
    private readonly studyMaterialService: StudyMaterialService,
  ) { }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'pdf', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }],
      StudyMaterialController.createStudyMaterialUploadConfig()
    )
  )
  create(
    @Body() dto: CreateStudyMaterialDto,
    @UploadedFiles() files: { pdf?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] }
  ) {
    return this.createStudyMaterial(dto, files);
  }

  @Post('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'pdf', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }],
      StudyMaterialController.createStudyMaterialUploadConfig()
    )
  )
  admincreate(
    @Body() dto: CreateStudyMaterialDto,
    @UploadedFiles() files: { pdf?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] }
  ) {
    return this.createStudyMaterial(dto, files);
  }


  @Get('list')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'study_material'])
  findAll(@Query() dto: StudyMaterialPaginationDto) {
    return this.studyMaterialService.findAll(dto);
  }


  @Get('tutor/list')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  tutorUpdate(@Param('id') id: string, @Body() dto: UpdateStudyMaterialDto) {
    return this.studyMaterialService.update(id, dto);
  }
  @Put('pdf/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @UseInterceptors(
    FileInterceptor('file', StudyMaterialController.createSingleFileConfig('./uploads/StudyMaterial/pdfs', FileSizeLimit.DOCUMENT_SIZE))
  )
  async pdf(
    @Param('id') id: string,
    @UploadedFile(new ParseFilePipe({ validators: [] })) file: Express.Multer.File,
  ) {
    return this.handlePdfUpload(id, file);
  }

  @Put('admin/pdf/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'study_material'])
  @UseInterceptors(
    FileInterceptor('file', StudyMaterialController.createSingleFileConfig('./uploads/StudyMaterial/pdfs', FileSizeLimit.DOCUMENT_SIZE))
  )
  async adminpdf(
    @Param('id') id: string,
    @UploadedFile(new ParseFilePipe({ validators: [] })) file: Express.Multer.File,
  ) {
    return this.handlePdfUpload(id, file);
  }

  private async handlePdfUpload(id: string, file: Express.Multer.File) {
    const fileData = await this.studyMaterialService.findOne(id);
    return this.studyMaterialService.pdf(file.path, fileData);
  }

  private createStudyMaterial(dto: CreateStudyMaterialDto, files: { pdf?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] }) {
    const pdf = files.pdf?.[0];
    const thumbnail = files.thumbnail?.[0];
    return this.studyMaterialService.create(dto, pdf, thumbnail);
  }

  private static createStudyMaterialUploadConfig() {
    return {
      storage: diskStorage({
        destination: (req, file, callback) => {
          let dest;
          if (file.fieldname === 'pdf') dest = './uploads/StudyMaterial/pdfs';
          else if (file.fieldname === 'thumbnail') dest = './uploads/StudyMaterial/thumbnails';
          callback(null, dest);
        },
        filename: (req, file, callback) => {
          const randomName = randomBytes(16).toString('hex');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: FileSizeLimit.DOCUMENT_SIZE,
        files: 2,
        fields: 10,
        fieldNameSize: 100,
        fieldSize: 1048576,
        parts: 12
      },
    };
  }

  private static createSingleFileConfig(destination: string, fileSize: number) {
    return {
      storage: diskStorage({
        destination,
        filename: (req, file, callback) => {
          const randomName = randomBytes(16).toString('hex');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: { 
        fileSize,
        files: 1,
        fields: 5,
        fieldNameSize: 100,
        fieldSize: 1048576,
        parts: 7
      },
    };
  }

  }




