import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Put, UploadedFile, UseInterceptors, ParseFilePipe } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto, SubjectPaginationDto, UpdateStatusDto, BulkSubjectStatusDto, TutorSubjectRequestDto, ApproveTutorSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { PermissionAction, UserRole, FileSizeLimit } from 'src/enum';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Account } from 'src/account/entities/account.entity';
import { AdminProtected } from 'src/admin-action-log/decorators/admin-protected.decorator';

@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'subjects'])
  create(@Body() createSubjectDto: CreateSubjectDto, @CurrentUser() user: Account) {
    return this.subjectsService.create(createSubjectDto, user.id);
  }

  @Get('top-subjects')
  getTopSubjects() {
    return this.subjectsService.getTopSubjects();
  }

  @Patch('top-subject/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'subjects'])
  updateTopSubject(@Param('id') id: string, @Body('topSubject') topSubject: boolean) {
    return this.subjectsService.updateTopSubject(id, topSubject);
  }

  @Get('list')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'subjects'])
  findAll(@Query() dto:SubjectPaginationDto) {
    return this.subjectsService.findAll(dto);
  }

    @Get('all')
   //@UseGuards(AuthGuard('jwt'), RolesGuard, )
    findByUser() {
    return this.subjectsService.findByUser();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'subjects'])
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'subjects'])
  update(@Param('id') id: string, @Body() updateSubjectDto: UpdateSubjectDto) {
    return this.subjectsService.update(id, updateSubjectDto);
  }

  @Put('status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'subjects'])
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.subjectsService.updateStatus(id, dto);
  }

  @Put('bulk-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @CheckPermissions([PermissionAction.READ, 'study_material'])
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'subjects'])
  bulkUpdateStatus(@Body() dto: BulkSubjectStatusDto) {
    return this.subjectsService.bulkUpdateStatus(dto);
  }

  @Put('update/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'subjects'])
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/Subjects',
        filename: (req, file, callback) => {
          const randomName = new Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: FileSizeLimit.IMAGE_SIZE,
        files: 1,
        fields: 5
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
    const fileData = await this.subjectsService.findOne(id);
    return this.subjectsService.image(file.path, fileData);
  }
@Get('with-tutor-count')
  getSubjectsWithTutorCount() {
    return this.subjectsService.getSubjectsWithTutorCount();
  }

  // Tutor: create a new subject (goes to PENDING)
  @Post('tutor/create')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  tutorCreateSubject(@Body() dto: CreateSubjectDto, @CurrentUser() user: Account) {
    return this.subjectsService.tutorCreateSubject(dto, user.id);
  }

  // Admin: get all pending subjects created by tutors
  @Get('tutor/pending')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  getTutorPendingSubjects(@Query() dto: SubjectPaginationDto) {
    return this.subjectsService.getTutorPendingSubjects(dto);
  }

  // Tutor: request subjects (goes to PENDING)
  @Post('tutor/request')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  requestSubjects(@Body() dto: TutorSubjectRequestDto, @CurrentUser() user: Account) {
    return this.subjectsService.requestSubjects(user.id, dto);
  }

 
  @Get('tutor/requests/pending')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  getPendingSubjectRequests(@Query() dto: SubjectPaginationDto) {
    return this.subjectsService.getPendingSubjectRequests(dto);
  }

  @Put('tutor/requests/:id/approve')
  @UseGuards(AuthGuard('jwt'), RolesGuard,PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'subjects'])
  approveSubjectRequest(@Param('id') id: string, @Body() dto: ApproveTutorSubjectDto) {
    return this.subjectsService.approveSubjectRequest(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.DELETE, 'subjects'])
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(id);
  }

  
}
